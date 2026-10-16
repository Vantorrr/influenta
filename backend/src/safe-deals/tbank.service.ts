import dns from 'dns';
import https from 'https';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { URL } from 'url';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* older node */
}

export interface TBankInitParams {
  amount: number; // в рублях
  orderId: string;
  description: string;
  notificationUrl: string;
  successUrl: string;
  failUrl: string;
  customerEmail?: string;
}

export interface TBankInitResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  status?: string;
  errorCode?: string;
  message?: string;
}

export interface TBankSimpleResult {
  success: boolean;
  status?: string;
  errorCode?: string;
  message?: string;
}

/**
 * Клиент T-Bank (Tinkoff) Internet Acquiring.
 * Документация: https://developer.tbank.ru/eacq/
 *
 * На Railway Node ругается на цепочку сертификатов T-Bank
 * (SELF_SIGNED_CERT_IN_CHAIN) — для шлюза используем отдельный https.Agent.
 */
@Injectable()
export class TBankService {
  private readonly logger = new Logger(TBankService.name);
  private readonly terminalKey: string;
  private readonly password: string;
  private readonly apiUrl: string;
  private readonly httpsAgent: https.Agent;

  constructor(private readonly configService: ConfigService) {
    this.terminalKey = this.configService.get<string>('app.payments.tbank.terminalKey') || '';
    this.password = this.configService.get<string>('app.payments.tbank.password') || '';
    this.apiUrl =
      this.configService.get<string>('app.payments.tbank.apiUrl') || 'https://securepay.tinkoff.ru/v2';

    // По умолчанию ослабляем TLS только для T-Bank: иначе fetch падает за ~100ms
    // с SELF_SIGNED_CERT_IN_CHAIN, хотя Telegram/остальное работает.
    const insecure =
      (process.env.TBANK_TLS_INSECURE || 'true').toLowerCase() !== 'false';
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      rejectUnauthorized: !insecure,
    });
    if (insecure) {
      this.logger.warn('T-Bank TLS: rejectUnauthorized=false (TBANK_TLS_INSECURE)');
    }

    if (!this.terminalKey || !this.password) {
      this.logger.warn('T-Bank: TBANK_TERMINAL_KEY / TBANK_PASSWORD не заданы');
    } else {
      this.logger.log(`T-Bank acquiring terminal: ${this.terminalKey.slice(0, 6)}…`);
    }
  }

  isConfigured(): boolean {
    return !!(this.terminalKey && this.password);
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private isTransient(err: any): boolean {
    const code = err?.code || err?.cause?.code || '';
    const msg = String(err?.message || '');
    return (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET') ||
      msg.includes('socket')
    );
  }

  private generateToken(params: Record<string, string | number | boolean | undefined | null>): string {
    const tokenSource: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'object') continue;
      tokenSource[key] = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    }
    tokenSource['Password'] = this.password;

    return createHash('sha256')
      .update(
        Object.keys(tokenSource)
          .sort()
          .map((k) => tokenSource[k])
          .join(''),
        'utf8',
      )
      .digest('hex');
  }

  private httpsPostJson(urlStr: string, body: Record<string, any>): Promise<{ status: number; text: string }> {
    const url = new URL(urlStr);
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 443,
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          agent: this.httpsAgent,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 25000,
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on('end', () => {
            resolve({
              status: res.statusCode || 0,
              text: Buffer.concat(chunks).toString('utf8'),
            });
          });
        },
      );
      req.on('timeout', () => req.destroy(Object.assign(new Error('timeout'), { code: 'ETIMEDOUT' })));
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private async post<T = any>(
    method: string,
    body: Record<string, any>,
  ): Promise<{ data: T | null; error?: string }> {
    const url = `${this.apiUrl.replace(/\/$/, '')}/${method}`;
    const maxAttempts = 4;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { status, text } = await this.httpsPostJson(url, body);
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          lastError = `Неверный ответ шлюза (HTTP ${status}): ${text.slice(0, 120)}`;
          this.logger.error(`T-Bank ${method}: ${lastError}`);
          return { data: null, error: lastError };
        }
        return { data: data as T };
      } catch (err: any) {
        lastError = err?.code || err?.message || 'unknown';
        this.logger.error(`T-Bank ${method} attempt ${attempt}/${maxAttempts}: ${lastError}`);
        if (!this.isTransient(err) || attempt === maxAttempts) break;
        await this.sleep(400 * attempt);
      }
    }

    return {
      data: null,
      error: `Нет ответа от платёжного шлюза (${lastError})`,
    };
  }

  async init(params: TBankInitParams): Promise<TBankInitResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'Платежи не настроены: задайте TBANK_TERMINAL_KEY и TBANK_PASSWORD в Railway',
      };
    }

    const amountKopecks = Math.round(params.amount * 100);

    const base: Record<string, any> = {
      TerminalKey: this.terminalKey,
      Amount: amountKopecks,
      OrderId: params.orderId,
      Description: (params.description || 'Безопасная сделка').slice(0, 250),
      NotificationURL: params.notificationUrl,
      SuccessURL: params.successUrl,
      FailURL: params.failUrl,
    };

    const Token = this.generateToken(base);
    const requestBody: Record<string, any> = { ...base, Token };

    const sendReceipt = this.configService.get<boolean>('app.payments.tbank.sendReceipt');
    if (sendReceipt) {
      const email = params.customerEmail || this.configService.get<string>('app.payments.tbank.receiptEmail');
      requestBody.Receipt = {
        Email: email,
        Taxation: this.configService.get<string>('app.payments.tbank.taxation') || 'usn_income',
        Items: [
          {
            Name: (params.description || 'Безопасная сделка').slice(0, 128),
            Price: amountKopecks,
            Quantity: 1,
            Amount: amountKopecks,
            Tax: this.configService.get<string>('app.payments.tbank.vat') || 'none',
          },
        ],
      };
    }

    const { data, error } = await this.post('Init', requestBody);
    if (!data) {
      return { success: false, message: error || 'Нет ответа от платёжного шлюза' };
    }

    if (data.Success && data.PaymentURL) {
      return {
        success: true,
        paymentId: String(data.PaymentId),
        paymentUrl: data.PaymentURL,
        status: data.Status,
      };
    }

    this.logger.error(
      `T-Bank Init failed: ${data.ErrorCode} ${data.Message} ${data.Details || ''}`,
    );
    return {
      success: false,
      errorCode: data.ErrorCode,
      message: [data.Message, data.Details].filter(Boolean).join('. ') || 'Ошибка инициализации платежа',
    };
  }

  async confirm(paymentId: string, amount?: number): Promise<TBankSimpleResult> {
    const base: Record<string, any> = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };
    if (amount !== undefined) base.Amount = Math.round(amount * 100);
    const Token = this.generateToken(base);
    const { data, error } = await this.post('Confirm', { ...base, Token });
    if (!data) return { success: false, message: error || 'Нет ответа от платёжного шлюза' };
    if (data.Success) return { success: true, status: data.Status };
    this.logger.error(`T-Bank Confirm failed: ${data.ErrorCode} ${data.Message}`);
    return { success: false, errorCode: data.ErrorCode, message: data.Message };
  }

  async cancel(paymentId: string, amount?: number): Promise<TBankSimpleResult> {
    const base: Record<string, any> = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };
    if (amount !== undefined) base.Amount = Math.round(amount * 100);
    const Token = this.generateToken(base);
    const { data, error } = await this.post('Cancel', { ...base, Token });
    if (!data) return { success: false, message: error || 'Нет ответа от платёжного шлюза' };
    if (data.Success) return { success: true, status: data.Status };
    this.logger.error(`T-Bank Cancel failed: ${data.ErrorCode} ${data.Message}`);
    return { success: false, errorCode: data.ErrorCode, message: data.Message };
  }

  async getState(paymentId: string): Promise<TBankSimpleResult> {
    const base: Record<string, any> = {
      TerminalKey: this.terminalKey,
      PaymentId: paymentId,
    };
    const Token = this.generateToken(base);
    const { data, error } = await this.post('GetState', { ...base, Token });
    if (!data) return { success: false, message: error || 'Нет ответа от платёжного шлюза' };
    if (data.Success) return { success: true, status: data.Status };
    return { success: false, errorCode: data.ErrorCode, message: data.Message };
  }

  async ping(): Promise<{
    ok: boolean;
    terminalKey?: string;
    message: string;
    paymentId?: string;
  }> {
    if (!this.isConfigured()) {
      return { ok: false, message: 'TBANK_TERMINAL_KEY / TBANK_PASSWORD не заданы' };
    }
    const orderId = `ping-${Date.now()}`;
    const init = await this.init({
      amount: 1,
      orderId,
      description: 'Influenta gateway ping',
      notificationUrl: 'https://example.com/ping',
      successUrl: 'https://example.com/ok',
      failUrl: 'https://example.com/fail',
    });
    if (!init.success || !init.paymentId) {
      return {
        ok: false,
        terminalKey: this.terminalKey,
        message: init.message || 'Init failed',
      };
    }
    await this.cancel(init.paymentId);
    return {
      ok: true,
      terminalKey: this.terminalKey,
      paymentId: init.paymentId,
      message: 'OK',
    };
  }

  verifyNotification(body: Record<string, any>): boolean {
    if (!body || typeof body !== 'object' || !body.Token) return false;
    const { Token, ...rest } = body;
    const expected = this.generateToken(rest);
    return expected === String(Token);
  }
}

import dns from 'dns';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

// Railway/EU часто ходит в api по IPv6 → T-Bank рвёт/таймаутит
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
 * Токен запроса = SHA-256 от конкатенации значений всех корневых
 * скалярных параметров (+ Password), отсортированных по ключу.
 * Вложенные объекты (Receipt, DATA) и сам Token в расчёт не входят.
 */
@Injectable()
export class TBankService {
  private readonly logger = new Logger(TBankService.name);
  private readonly terminalKey: string;
  private readonly password: string;
  private readonly apiUrl: string;
  private proxyDispatcher: any | null = null;

  constructor(private readonly configService: ConfigService) {
    this.terminalKey = this.configService.get<string>('app.payments.tbank.terminalKey') || '';
    this.password = this.configService.get<string>('app.payments.tbank.password') || '';
    this.apiUrl =
      this.configService.get<string>('app.payments.tbank.apiUrl') || 'https://securepay.tinkoff.ru/v2';

    const proxyUrl =
      this.configService.get<string>('app.payments.tbank.proxyUrl') ||
      process.env.TBANK_HTTPS_PROXY ||
      process.env.HTTPS_PROXY ||
      '';
    if (proxyUrl) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ProxyAgent } = require('undici');
        this.proxyDispatcher = new ProxyAgent(proxyUrl);
        this.logger.log(`T-Bank: using HTTPS proxy for acquiring`);
      } catch (e: any) {
        this.logger.warn(`T-Bank proxy init failed: ${e?.message}`);
      }
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
    const code = err?.cause?.code || err?.code || '';
    const msg = String(err?.message || err?.cause?.message || '');
    return (
      code === 'ECONNRESET' ||
      code === 'ETIMEDOUT' ||
      code === 'ECONNREFUSED' ||
      code === 'ENOTFOUND' ||
      code === 'EAI_AGAIN' ||
      code === 'UND_ERR_CONNECT_TIMEOUT' ||
      code === 'UND_ERR_SOCKET' ||
      code === 'UND_ERR_HEADERS_TIMEOUT' ||
      msg.includes('fetch failed') ||
      msg.includes('timeout') ||
      msg.includes('ECONNRESET')
    );
  }

  private generateToken(params: Record<string, string | number | boolean | undefined | null>): string {
    const tokenSource: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'object') continue; // Receipt / DATA не участвуют
      tokenSource[key] = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);
    }
    tokenSource['Password'] = this.password;

    const concatenated = Object.keys(tokenSource)
      .sort()
      .map((k) => tokenSource[k])
      .join('');

    return createHash('sha256').update(concatenated, 'utf8').digest('hex');
  }

  private async post<T = any>(
    method: string,
    body: Record<string, any>,
  ): Promise<{ data: T | null; error?: string }> {
    const url = `${this.apiUrl.replace(/\/$/, '')}/${method}`;
    const maxAttempts = 4;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);
      try {
        const init: RequestInit & { dispatcher?: any } = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        };
        if (this.proxyDispatcher) init.dispatcher = this.proxyDispatcher;

        const res = await fetch(url, init);
        const text = await res.text();
        let data: any = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          lastError = `Неверный ответ шлюза (HTTP ${res.status}): ${text.slice(0, 120)}`;
          this.logger.error(`T-Bank ${method}: ${lastError}`);
          return { data: null, error: lastError };
        }
        return { data: data as T };
      } catch (err: any) {
        const cause = err?.cause?.code || err?.cause?.message || err?.message || 'unknown';
        lastError = String(cause);
        this.logger.error(`T-Bank ${method} attempt ${attempt}/${maxAttempts}: ${lastError}`);
        if (!this.isTransient(err) || attempt === maxAttempts) {
          break;
        }
        await this.sleep(400 * attempt);
      } finally {
        clearTimeout(timeout);
      }
    }

    return {
      data: null,
      error: `Нет ответа от платёжного шлюза (${lastError}). Проверьте сеть/прокси до securepay.tinkoff.ru`,
    };
  }

  /** Инициализация платежа. Возвращает ссылку на оплату. */
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

  /** Подтверждение (списание) захолдированного платежа — двухстадийная схема. */
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

  /** Отмена/возврат платежа. Для захолдированного — reverse, для списанного — refund. */
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

  /** Пинг шлюза: создаёт и сразу отменяет платёж на 1 ₽ */
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

  /**
   * Проверка подписи входящего уведомления (webhook).
   * Токен считается по всем корневым скалярным полям тела (+ Password), кроме Token.
   */
  verifyNotification(body: Record<string, any>): boolean {
    if (!body || typeof body !== 'object' || !body.Token) return false;
    const { Token, ...rest } = body;
    const expected = this.generateToken(rest);
    return expected === String(Token);
  }
}

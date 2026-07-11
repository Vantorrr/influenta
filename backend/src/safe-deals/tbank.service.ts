import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

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

  constructor(private readonly configService: ConfigService) {
    this.terminalKey = this.configService.get<string>('app.payments.tbank.terminalKey') || '';
    this.password = this.configService.get<string>('app.payments.tbank.password') || '';
    this.apiUrl =
      this.configService.get<string>('app.payments.tbank.apiUrl') || 'https://securepay.tinkoff.ru/v2';
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

  private async post<T = any>(method: string, body: Record<string, any>): Promise<T | null> {
    try {
      const res = await fetch(`${this.apiUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as T;
      return data;
    } catch (err: any) {
      this.logger.error(`T-Bank ${method} request failed: ${err?.message}`);
      return null;
    }
  }

  /** Инициализация платежа. Возвращает ссылку на оплату. */
  async init(params: TBankInitParams): Promise<TBankInitResult> {
    // T-Bank ожидает сумму в копейках (целое число)
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

    // Опциональный онлайн-чек (54-ФЗ)
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

    const data = await this.post('Init', requestBody);
    if (!data) {
      return { success: false, message: 'Нет ответа от платёжного шлюза' };
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
    const data = await this.post('Confirm', { ...base, Token });
    if (!data) return { success: false, message: 'Нет ответа от платёжного шлюза' };
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
    const data = await this.post('Cancel', { ...base, Token });
    if (!data) return { success: false, message: 'Нет ответа от платёжного шлюза' };
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
    const data = await this.post('GetState', { ...base, Token });
    if (!data) return { success: false, message: 'Нет ответа от платёжного шлюза' };
    if (data.Success) return { success: true, status: data.Status };
    return { success: false, errorCode: data.ErrorCode, message: data.Message };
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

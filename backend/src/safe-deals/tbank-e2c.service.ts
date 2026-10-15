import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export interface E2cPayoutParams {
  amount: number; // рубли
  orderId: string;
  phone: string; // 7XXXXXXXXXX
  sbpMemberId: string;
  paymentRecipientId?: string;
}

export interface E2cPayoutResult {
  success: boolean;
  paymentId?: string;
  status?: string;
  errorCode?: string;
  message?: string;
  maskedFio?: string;
}

export interface SbpMember {
  memberId: string;
  memberName: string;
}

/** Популярные банки СБП — fallback, если GetSbpMembers недоступен */
const FALLBACK_SBP_MEMBERS: SbpMember[] = [
  { memberId: '100000000004', memberName: 'Т-Банк' },
  { memberId: '100000000111', memberName: 'Сбербанк' },
  { memberId: '100000000008', memberName: 'Альфа-Банк' },
  { memberId: '100000000007', memberName: 'Райффайзенбанк' },
  { memberId: '100000000015', memberName: 'Открытие' },
  { memberId: '100000000001', memberName: 'Газпромбанк' },
  { memberId: '100000000005', memberName: 'ВТБ' },
  { memberId: '100000000012', memberName: 'Россельхозбанк' },
  { memberId: '100000000013', memberName: 'Совкомбанк' },
  { memberId: '100000000018', memberName: 'Яндекс Банк' },
  { memberId: '100000000022', memberName: 'Озон Банк' },
  { memberId: '100000000017', memberName: 'МТС Банк' },
  { memberId: '100000000020', memberName: 'Росбанк' },
  { memberId: '100000000006', memberName: 'АК Барс' },
  { memberId: '100000000016', memberName: 'Почта Банк' },
];

/**
 * Клиент T-Bank E2C (выплаты физлицам).
 * Боевой URL: https://securepay.tinkoff.ru/e2c/v2
 * Для СБП достаточно Init (без Payment).
 */
@Injectable()
export class TBankE2cService {
  private readonly logger = new Logger(TBankE2cService.name);
  private readonly terminalKey: string;
  private readonly password: string;
  private readonly apiUrl: string;
  private sbpCache: { at: number; members: SbpMember[] } | null = null;

  constructor(private readonly configService: ConfigService) {
    this.terminalKey =
      this.configService.get<string>('app.payments.tbank.payoutTerminalKey') || '';
    this.password = this.configService.get<string>('app.payments.tbank.payoutPassword') || '';
    this.apiUrl =
      this.configService.get<string>('app.payments.tbank.e2cApiUrl') ||
      'https://securepay.tinkoff.ru/e2c/v2';
  }

  isConfigured(): boolean {
    return !!(this.terminalKey && this.password);
  }

  private generateToken(
    params: Record<string, string | number | boolean | undefined | null>,
  ): string {
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

  private async post<T = any>(method: string, body: Record<string, any>): Promise<T | null> {
    try {
      const res = await fetch(`${this.apiUrl}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return (await res.json()) as T;
    } catch (err: any) {
      this.logger.error(`E2C ${method} failed: ${err?.message}`);
      return null;
    }
  }

  /** Выплата по СБП (телефон + банк получателя). */
  async payoutSbp(params: E2cPayoutParams): Promise<E2cPayoutResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Выплатной терминал не настроен' };
    }

    const amountKopecks = Math.round(params.amount * 100);
    if (amountKopecks < 100) {
      return { success: false, message: 'Минимальная сумма выплаты 1 ₽' };
    }

    const base: Record<string, any> = {
      TerminalKey: this.terminalKey,
      OrderId: params.orderId,
      Amount: amountKopecks,
      Phone: params.phone,
      SbpMemberId: String(params.sbpMemberId),
      FinalPayout: true,
      PaymentRecipientId: params.paymentRecipientId || params.phone,
    };

    const Token = this.generateToken(base);
    const data = await this.post<any>('Init', { ...base, Token });
    if (!data) {
      return { success: false, message: 'Нет ответа от шлюза выплат' };
    }

    if (data.Success) {
      return {
        success: true,
        paymentId: data.PaymentId != null ? String(data.PaymentId) : undefined,
        status: data.Status,
        maskedFio: data.MaskedFio,
      };
    }

    this.logger.error(
      `E2C Init failed: ${data.ErrorCode} ${data.Message} ${data.Details || ''}`,
    );
    return {
      success: false,
      errorCode: data.ErrorCode,
      message:
        [data.Message, data.Details].filter(Boolean).join('. ') || 'Ошибка выплаты',
      status: data.Status,
    };
  }

  async getState(paymentId: string): Promise<E2cPayoutResult> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Выплатной терминал не настроен' };
    }
    const base = { TerminalKey: this.terminalKey, PaymentId: paymentId };
    const data = await this.post<any>('GetState', { ...base, Token: this.generateToken(base) });
    if (!data) return { success: false, message: 'Нет ответа от шлюза выплат' };
    if (data.Success) {
      return { success: true, status: data.Status, paymentId: String(data.PaymentId || paymentId) };
    }
    return {
      success: false,
      errorCode: data.ErrorCode,
      message: data.Message,
      status: data.Status,
    };
  }

  async getSbpMembers(): Promise<SbpMember[]> {
    if (this.sbpCache && Date.now() - this.sbpCache.at < 6 * 60 * 60 * 1000) {
      return this.sbpCache.members;
    }

    if (!this.isConfigured()) {
      return FALLBACK_SBP_MEMBERS;
    }

    try {
      const base = { TerminalKey: this.terminalKey };
      const data = await this.post<any>('GetSbpMembers', {
        ...base,
        Token: this.generateToken(base),
      });
      const raw =
        data?.Members ||
        data?.members ||
        data?.SbpMembers ||
        data?.Data ||
        (Array.isArray(data) ? data : null);

      if (Array.isArray(raw) && raw.length > 0) {
        const members: SbpMember[] = raw
          .map((m: any) => ({
            memberId: String(m.MemberId || m.memberId || m.Id || m.id || ''),
            memberName: String(
              m.MemberName || m.memberName || m.Name || m.name || m.BankName || '',
            ),
          }))
          .filter((m) => m.memberId && m.memberName)
          .sort((a, b) => a.memberName.localeCompare(b.memberName, 'ru'));
        if (members.length) {
          this.sbpCache = { at: Date.now(), members };
          return members;
        }
      }
    } catch (e: any) {
      this.logger.warn(`GetSbpMembers fallback: ${e?.message}`);
    }

    this.sbpCache = { at: Date.now(), members: FALLBACK_SBP_MEMBERS };
    return FALLBACK_SBP_MEMBERS;
  }

  verifyNotification(body: Record<string, any>): boolean {
    if (!body || typeof body !== 'object' || !body.Token || !this.password) return false;
    const { Token, ...rest } = body;
    return this.generateToken(rest) === String(Token);
  }
}

/** Нормализация телефона РФ/СНГ → 7XXXXXXXXXX */
export function normalizePayoutPhone(input?: string | null): string | null {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return '7' + digits.slice(1);
  }
  if (digits.length === 10) return '7' + digits;
  return null;
}

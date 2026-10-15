import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { SafeDeal, SafeDealStatus } from './entities/safe-deal.entity';
import { CryptoWallet } from './entities/crypto-wallet.entity';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';
import { Response, ResponseStatus } from '../responses/entities/response.entity';
import { User } from '../users/entities/user.entity';
import { TBankService } from './tbank.service';
import { TBankE2cService, normalizePayoutPhone } from './tbank-e2c.service';
import { TelegramService } from '../telegram/telegram.service';

export type DealPaymentOpts = {
  paymentMethod?: 'card' | 'crypto';
  cryptoWalletId?: string;
  cryptoAmount?: string;
};

@Injectable()
export class SafeDealsService implements OnModuleInit {
  private readonly logger = new Logger(SafeDealsService.name);

  constructor(
    @InjectRepository(SafeDeal)
    private readonly dealRepo: Repository<SafeDeal>,
    @InjectRepository(CryptoWallet)
    private readonly walletRepo: Repository<CryptoWallet>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(Response)
    private readonly responseRepo: Repository<Response>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tbank: TBankService,
    private readonly e2c: TBankE2cService,
    private readonly telegram: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * В проде synchronize отключён — создаём таблицу и колонку вручную,
   * чтобы фича работала сразу после деплоя без ручных миграций.
   */
  async onModuleInit() {
    try {
      await this.dealRepo.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
      await this.dealRepo.query(`
        CREATE TABLE IF NOT EXISTS safe_deals (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "offerId" uuid,
          "advertiserUserId" uuid NOT NULL,
          "bloggerUserId" uuid NOT NULL,
          title varchar,
          amount numeric(10,2) NOT NULL DEFAULT 0,
          "commissionAmount" numeric(10,2) NOT NULL DEFAULT 0,
          "payoutAmount" numeric(10,2) NOT NULL DEFAULT 0,
          status varchar NOT NULL DEFAULT 'created',
          "tbankPaymentId" varchar,
          "tbankOrderId" varchar,
          "tbankStatus" varchar,
          "paymentUrl" text,
          "isTwoStage" boolean NOT NULL DEFAULT false,
          "deliveryNote" text,
          "disputeReason" text,
          "paidAt" timestamptz,
          "deliveredAt" timestamptz,
          "releasedAt" timestamptz,
          "refundedAt" timestamptz,
          "disputedAt" timestamptz,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
      `);
      await this.dealRepo.query(
        `CREATE INDEX IF NOT EXISTS idx_safe_deals_offer_id ON safe_deals ("offerId");`,
      );
      await this.dealRepo.query(
        `CREATE INDEX IF NOT EXISTS idx_safe_deals_order_id ON safe_deals ("tbankOrderId");`,
      );
      await this.dealRepo.query(
        `CREATE INDEX IF NOT EXISTS idx_safe_deals_status ON safe_deals (status);`,
      );
      await this.dealRepo.query(
        `ALTER TABLE offers ADD COLUMN IF NOT EXISTS "useSafeDeal" boolean DEFAULT false;`,
      );
      // Поддержка сделок из откликов на объявления
      await this.dealRepo.query(`ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "responseId" uuid;`);
      await this.dealRepo.query(`ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "listingId" uuid;`);
      await this.dealRepo.query(
        `CREATE INDEX IF NOT EXISTS idx_safe_deals_response_id ON safe_deals ("responseId");`,
      );
      // Крипто-оплата (ручное управление ТП/админом)
      await this.dealRepo.query(`
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "paymentMethod" varchar(16) DEFAULT 'card';
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoWalletId" uuid;
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoNetwork" varchar(16);
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoCurrency" varchar(16);
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoAddress" varchar(256);
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoAmount" varchar(64);
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "cryptoTxHash" varchar(256);
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "payoutStatus" varchar(24) DEFAULT 'none';
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "payoutPaymentId" varchar;
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "payoutOrderId" varchar;
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "payoutBankStatus" varchar;
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "payoutError" text;
        ALTER TABLE safe_deals ADD COLUMN IF NOT EXISTS "paidOutAt" timestamptz;
      `);
      await this.dealRepo.query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutPhone" varchar(16);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutSbpMemberId" varchar(32);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "payoutSbpBankName" varchar(128);
      `);
      await this.dealRepo.query(`
        CREATE TABLE IF NOT EXISTS crypto_wallets (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          label varchar(64) NOT NULL,
          network varchar(16) NOT NULL DEFAULT 'TRC20',
          currency varchar(16) NOT NULL DEFAULT 'USDT',
          address varchar(256) NOT NULL,
          "isActive" boolean NOT NULL DEFAULT true,
          notes text,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
      `);
      this.logger.log('✅ safe_deals schema ensured');
    } catch (e: any) {
      this.logger.error(`Failed to ensure safe_deals schema: ${e?.message}`);
    }
  }

  private get commissionPct(): number {
    const pct = this.configService.get<number>('app.platform.commission');
    return typeof pct === 'number' && pct >= 0 && pct < 100 ? pct : 10;
  }

  private computeAmounts(amount: number) {
    const commissionAmount = Math.round((amount * this.commissionPct) / 100);
    const payoutAmount = Math.max(0, amount - commissionAmount);
    return { commissionAmount, payoutAmount };
  }

  private toPublic(deal: SafeDeal) {
    return {
      id: deal.id,
      offerId: deal.offerId,
      responseId: deal.responseId,
      listingId: deal.listingId,
      advertiserUserId: deal.advertiserUserId,
      bloggerUserId: deal.bloggerUserId,
      title: deal.title,
      amount: Number(deal.amount),
      commissionAmount: Number(deal.commissionAmount),
      payoutAmount: Number(deal.payoutAmount),
      status: deal.status,
      paymentUrl: deal.paymentUrl,
      paymentMethod: deal.paymentMethod || 'card',
      cryptoWalletId: deal.cryptoWalletId,
      cryptoNetwork: deal.cryptoNetwork,
      cryptoCurrency: deal.cryptoCurrency,
      cryptoAddress: deal.cryptoAddress,
      cryptoAmount: deal.cryptoAmount,
      cryptoTxHash: deal.cryptoTxHash,
      tbankStatus: deal.tbankStatus,
      isTwoStage: deal.isTwoStage,
      deliveryNote: deal.deliveryNote,
      disputeReason: deal.disputeReason,
      paidAt: deal.paidAt,
      deliveredAt: deal.deliveredAt,
      releasedAt: deal.releasedAt,
      refundedAt: deal.refundedAt,
      disputedAt: deal.disputedAt,
      payoutStatus: deal.payoutStatus || 'none',
      payoutPaymentId: deal.payoutPaymentId,
      payoutOrderId: deal.payoutOrderId,
      payoutBankStatus: deal.payoutBankStatus,
      payoutError: deal.payoutError,
      paidOutAt: deal.paidOutAt,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
  }

  /** Инициализация оплаты: карта (T-Bank) или крипта (ручное подтверждение) */
  private async initiatePayment(deal: SafeDeal, opts?: DealPaymentOpts) {
    const method = opts?.paymentMethod === 'crypto' ? 'crypto' : 'card';

    if (method === 'crypto') {
      let wallet: CryptoWallet | null = null;
      if (opts?.cryptoWalletId) {
        wallet = await this.walletRepo.findOne({
          where: { id: opts.cryptoWalletId, isActive: true },
        });
      }
      if (!wallet) {
        wallet = await this.walletRepo.findOne({
          where: { isActive: true },
          order: { createdAt: 'ASC' },
        });
      }
      if (!wallet) {
        throw new BadRequestException(
          'Крипто-оплата временно недоступна: нет активных кошельков. Обратитесь в поддержку.',
        );
      }

      deal.paymentMethod = 'crypto';
      deal.cryptoWalletId = wallet.id;
      deal.cryptoNetwork = wallet.network;
      deal.cryptoCurrency = wallet.currency;
      deal.cryptoAddress = wallet.address;
      deal.cryptoAmount = opts?.cryptoAmount || String(deal.amount);
      deal.paymentUrl = undefined;
      deal.tbankOrderId = undefined;
      deal.tbankPaymentId = undefined;
      deal.status = SafeDealStatus.AWAITING_PAYMENT;
      deal = await this.dealRepo.save(deal);

      await this.notify(
        deal.advertiserUserId,
        `💎 <b>Оплата криптой</b>\n\nСеть: <b>${wallet.network}</b>\nВалюта: <b>${wallet.currency}</b>\nАдрес:\n<code>${wallet.address}</code>\n\nПосле перевода отправьте hash транзакции в сделке. Подтверждение — вручную через поддержку.`,
        this.dealButton(deal.id, 'Открыть сделку'),
      );

      // Уведомляем админов о новой крипто-сделке
      const adminIds = this.configService.get<number[]>('app.admins.telegramIds') || [];
      for (const adminTgId of adminIds) {
        try {
          await this.telegram.sendMessage(
            adminTgId,
            `💎 <b>Новая крипто-сделка</b>\nСумма: ${deal.amount}₽\n${wallet.currency} ${wallet.network}\nID: ${deal.id}`,
          );
        } catch {
          /* ignore */
        }
      }

      return { deal: this.toPublic(deal), crypto: true as const };
    }

    const orderId = randomUUID().replace(/-/g, '');
    const initResult = await this.tbank.init({
      amount: Number(deal.amount),
      orderId,
      description: `Безопасная сделка: ${deal.title}`.slice(0, 250),
      notificationUrl: `${this.backendUrl()}/payments/tbank/webhook`,
      successUrl: `${this.frontendUrl()}/payment/success?dealId=${deal.id}`,
      failUrl: `${this.frontendUrl()}/payment/fail?dealId=${deal.id}`,
    });

    if (!initResult.success || !initResult.paymentUrl) {
      throw new BadRequestException(initResult.message || 'Не удалось создать платёж');
    }

    deal.paymentMethod = 'card';
    deal.tbankOrderId = orderId;
    deal.tbankPaymentId = initResult.paymentId;
    deal.paymentUrl = initResult.paymentUrl;
    deal.status = SafeDealStatus.AWAITING_PAYMENT;
    deal = await this.dealRepo.save(deal);

    return { deal: this.toPublic(deal), paymentUrl: initResult.paymentUrl, crypto: false as const };
  }

  private async notify(userId: string, text: string, replyMarkup?: any) {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user?.telegramId) {
        await this.telegram.sendMessage(parseInt(String(user.telegramId), 10), text, replyMarkup);
      }
    } catch (e: any) {
      this.logger.warn(`notify failed for user=${userId}: ${e?.message}`);
    }
  }

  private frontendUrl(): string {
    // Всегда веб-версия (Vercel), а НЕ Telegram mini app (t.me) — чтобы редиректы
    // после оплаты и кнопки в уведомлениях открывались на фронте, а не в мини-аппе.
    const fromEnv = process.env.FRONTEND_URL;
    if (fromEnv && /^https?:\/\//.test(fromEnv) && !fromEnv.includes('t.me')) {
      return fromEnv.replace(/\/$/, '');
    }
    return 'https://influentaa.vercel.app';
  }

  private backendUrl(): string {
    return (
      this.configService.get<string>('app.backendUrl') ||
      'https://web-production-2bad2.up.railway.app'
    );
  }

  private dealButton(dealId: string, text = 'Открыть сделку') {
    // web_app-кнопка → открывается внутри мини-аппа Telegram (сохраняется авторизация),
    // а не во внешнем браузере.
    return {
      inline_keyboard: [
        [{ text, web_app: { url: `${this.frontendUrl()}/safe-deals/${dealId}` } }],
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Создание сделки и инициализация оплаты (рекламодатель)
  // ─────────────────────────────────────────────────────────────
  async createForOffer(offerId: string, user: User, opts?: DealPaymentOpts) {
    const offer = await this.offerRepo.findOne({
      where: { id: offerId },
      relations: ['advertiser', 'advertiser.user', 'blogger'],
    });
    if (!offer) throw new NotFoundException('Предложение не найдено');

    if (offer.advertiser?.userId !== user.id) {
      throw new ForbiddenException('Оплатить сделку может только рекламодатель — автор предложения');
    }
    if (offer.status !== OfferStatus.ACCEPTED) {
      throw new BadRequestException('Безопасная сделка доступна только для принятого предложения');
    }

    const bloggerUserId = offer.blogger?.id;
    if (!bloggerUserId) throw new BadRequestException('У предложения не указан блогер');

    const amount = Number(offer.proposedBudget);
    if (!Number.isFinite(amount) || amount < 100) {
      throw new BadRequestException('Некорректная сумма сделки');
    }

    // Уже существующая сделка для этого оффера
    let deal = await this.dealRepo.findOne({ where: { offerId: offer.id } });
    if (deal && [SafeDealStatus.FUNDED, SafeDealStatus.IN_PROGRESS, SafeDealStatus.DELIVERED, SafeDealStatus.RELEASED].includes(deal.status)) {
      // Уже оплачено/в работе — повторная оплата не нужна
      return { deal: this.toPublic(deal), alreadyActive: true };
    }

    const { commissionAmount, payoutAmount } = this.computeAmounts(amount);

    if (!deal) {
      deal = this.dealRepo.create({
        offerId: offer.id,
        advertiserUserId: user.id,
        bloggerUserId,
        title: offer.projectTitle || 'Безопасная сделка',
        amount,
        commissionAmount,
        payoutAmount,
        status: SafeDealStatus.CREATED,
      });
      deal = await this.dealRepo.save(deal);
    } else {
      deal.amount = amount;
      deal.commissionAmount = commissionAmount;
      deal.payoutAmount = payoutAmount;
      deal.status = SafeDealStatus.CREATED;
    }

    return this.initiatePayment(deal, opts);
  }

  // ─────────────────────────────────────────────────────────────
  // Создание сделки по отклику на объявление (рекламодатель)
  // ─────────────────────────────────────────────────────────────
  async createForResponse(responseId: string, user: User, opts?: DealPaymentOpts) {
    const response = await this.responseRepo.findOne({
      where: { id: responseId },
      relations: [
        'listing',
        'listing.advertiser',
        'listing.advertiser.user',
        'blogger',
        'blogger.user',
      ],
    });
    if (!response) throw new NotFoundException('Отклик не найден');

    const advertiserUserId = (response as any)?.listing?.advertiser?.userId;
    if (!advertiserUserId || advertiserUserId !== user.id) {
      throw new ForbiddenException('Оплатить сделку может только рекламодатель — владелец объявления');
    }
    if (response.status !== ResponseStatus.ACCEPTED) {
      throw new BadRequestException('Безопасная сделка доступна только для принятого отклика');
    }

    const bloggerUserId = (response as any)?.blogger?.userId || (response as any)?.blogger?.user?.id;
    if (!bloggerUserId) throw new BadRequestException('У отклика не определён блогер');

    const amount = Number(response.proposedPrice);
    if (!Number.isFinite(amount) || amount < 10) {
      throw new BadRequestException('Некорректная сумма сделки');
    }

    const listingId = (response as any)?.listing?.id || (response as any)?.listingId;
    const title = (response as any)?.listing?.title || 'Безопасная сделка';

    let deal = await this.dealRepo.findOne({ where: { responseId: response.id } });
    if (
      deal &&
      [SafeDealStatus.FUNDED, SafeDealStatus.IN_PROGRESS, SafeDealStatus.DELIVERED, SafeDealStatus.RELEASED].includes(
        deal.status,
      )
    ) {
      return { deal: this.toPublic(deal), alreadyActive: true };
    }

    const { commissionAmount, payoutAmount } = this.computeAmounts(amount);

    if (!deal) {
      deal = this.dealRepo.create({
        responseId: response.id,
        listingId,
        advertiserUserId: user.id,
        bloggerUserId,
        title,
        amount,
        commissionAmount,
        payoutAmount,
        status: SafeDealStatus.CREATED,
      });
      deal = await this.dealRepo.save(deal);
    } else {
      deal.amount = amount;
      deal.commissionAmount = commissionAmount;
      deal.payoutAmount = payoutAmount;
      deal.listingId = listingId;
      deal.status = SafeDealStatus.CREATED;
    }

    return this.initiatePayment(deal, opts);
  }

  async getByResponse(responseId: string, user: User) {
    const deal = await this.dealRepo.findOne({ where: { responseId } });
    if (!deal) return null;
    if (deal.advertiserUserId !== user.id && deal.bloggerUserId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой сделке');
    }
    return this.toPublic(deal);
  }

  // ─────────────────────────────────────────────────────────────
  // Webhook от T-Bank
  // ─────────────────────────────────────────────────────────────
  async handleNotification(body: Record<string, any>): Promise<string> {
    if (!this.tbank.verifyNotification(body)) {
      this.logger.warn('T-Bank notification: invalid token, ignoring');
      return 'OK';
    }

    const orderId = String(body.OrderId || '');
    if (!orderId) return 'OK';

    const deal = await this.dealRepo.findOne({ where: { tbankOrderId: orderId } });
    if (!deal) {
      this.logger.warn(`T-Bank notification: deal not found for orderId=${orderId}`);
      return 'OK';
    }

    const status = String(body.Status || '');
    deal.tbankStatus = status;
    if (body.PaymentId) deal.tbankPaymentId = String(body.PaymentId);

    const prevStatus = deal.status;
    const wasFunded = deal.status === SafeDealStatus.FUNDED;

    switch (status) {
      case 'AUTHORIZED':
        // Двухстадийный холд — деньги заморожены
        deal.isTwoStage = true;
        if (!deal.paidAt) deal.paidAt = new Date();
        if (
          [SafeDealStatus.CREATED, SafeDealStatus.AWAITING_PAYMENT, SafeDealStatus.CANCELLED].includes(
            deal.status,
          )
        ) {
          deal.status = SafeDealStatus.FUNDED;
        }
        break;
      case 'CONFIRMED':
        // Одностадийное списание (или подтверждение холда)
        if (!deal.paidAt) deal.paidAt = new Date();
        if (
          [SafeDealStatus.CREATED, SafeDealStatus.AWAITING_PAYMENT, SafeDealStatus.CANCELLED].includes(
            deal.status,
          )
        ) {
          deal.status = SafeDealStatus.FUNDED;
        }
        break;
      case 'REVERSED':
      case 'REFUNDED':
        deal.status = SafeDealStatus.REFUNDED;
        if (!deal.refundedAt) deal.refundedAt = new Date();
        break;
      case 'REJECTED':
      case 'DEADLINE_EXPIRED':
      case 'CANCELED':
      case 'AUTH_FAIL':
        if (
          [SafeDealStatus.CREATED, SafeDealStatus.AWAITING_PAYMENT].includes(deal.status)
        ) {
          deal.status = SafeDealStatus.CANCELLED;
        }
        break;
      default:
        // NEW / FORM_SHOWED / прочее — промежуточные, ничего не меняем
        break;
    }

    await this.dealRepo.save(deal);

    // Уведомляем обе стороны при первом переходе в FUNDED
    if (!wasFunded && deal.status === SafeDealStatus.FUNDED) {
      await this.notify(
        deal.bloggerUserId,
        `🛡 <b>Безопасная сделка оплачена</b>\n\nРекламодатель внёс ${deal.amount}₽ на гарантийный счёт. Можете приступать к работе — после подтверждения выполнения вы получите ${deal.payoutAmount}₽.`,
        this.dealButton(deal.id),
      );
      await this.notify(
        deal.advertiserUserId,
        `🛡 <b>Оплата принята</b>\n\nСредства ${deal.amount}₽ захолдированы. Деньги уйдут блогеру только после того, как вы подтвердите выполнение работы.`,
        this.dealButton(deal.id),
      );
    }

    // Уведомляем при неуспешной оплате (первый переход в CANCELLED)
    const isFailure = ['REJECTED', 'CANCELED', 'AUTH_FAIL', 'DEADLINE_EXPIRED'].includes(status);
    if (isFailure && deal.status === SafeDealStatus.CANCELLED && prevStatus !== SafeDealStatus.CANCELLED) {
      await this.notify(
        deal.advertiserUserId,
        `❌ <b>Оплата не прошла</b>\n\nПлатёж по сделке «${deal.title || 'Безопасная сделка'}» на ${deal.amount}₽ не был завершён. Средства не списаны — вы можете попробовать оплатить ещё раз.`,
        this.dealButton(deal.id, 'Повторить оплату'),
      );
      await this.notify(
        deal.bloggerUserId,
        `ℹ️ <b>Оплата пока не прошла</b>\n\nРекламодатель ещё не смог оплатить безопасную сделку «${deal.title || 'Безопасная сделка'}». Как только оплата пройдёт, вы получите уведомление.`,
      );
    }

    return 'OK';
  }

  // ─────────────────────────────────────────────────────────────
  // Действия сторон
  // ─────────────────────────────────────────────────────────────
  private async loadForParticipant(dealId: string, userId: string, allowAdmin = false, isAdmin = false) {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Сделка не найдена');
    const isParticipant = deal.advertiserUserId === userId || deal.bloggerUserId === userId;
    if (!isParticipant && !(allowAdmin && isAdmin)) {
      throw new ForbiddenException('Нет доступа к этой сделке');
    }
    return deal;
  }

  async getById(dealId: string, user: User, isAdmin = false) {
    const deal = await this.loadForParticipant(dealId, user.id, true, isAdmin);
    return this.toPublic(deal);
  }

  async getByOffer(offerId: string, user: User) {
    const deal = await this.dealRepo.findOne({ where: { offerId } });
    if (!deal) return null;
    if (deal.advertiserUserId !== user.id && deal.bloggerUserId !== user.id) {
      throw new ForbiddenException('Нет доступа к этой сделке');
    }
    return this.toPublic(deal);
  }

  async listForUser(user: User) {
    const deals = await this.dealRepo
      .createQueryBuilder('deal')
      .where('deal.advertiserUserId = :uid OR deal.bloggerUserId = :uid', { uid: user.id })
      .orderBy('deal.updatedAt', 'DESC')
      .getMany();
    return deals.map((d) => this.toPublic(d));
  }

  /** Блогер отмечает работу выполненной */
  async markDelivered(dealId: string, user: User, note?: string) {
    const deal = await this.loadForParticipant(dealId, user.id);
    if (deal.bloggerUserId !== user.id) {
      throw new ForbiddenException('Отметить выполнение может только блогер');
    }
    if (![SafeDealStatus.FUNDED, SafeDealStatus.IN_PROGRESS].includes(deal.status)) {
      throw new BadRequestException('Отметить выполнение можно только для оплаченной сделки');
    }
    deal.status = SafeDealStatus.DELIVERED;
    deal.deliveredAt = new Date();
    if (note) deal.deliveryNote = note.slice(0, 2000);
    await this.dealRepo.save(deal);

    await this.notify(
      deal.advertiserUserId,
      `✅ <b>Блогер отметил работу выполненной</b>\n\nПроверьте результат и подтвердите — после этого ${deal.payoutAmount}₽ уйдут блогеру.`,
      this.dealButton(deal.id, 'Проверить и подтвердить'),
    );
    return this.toPublic(deal);
  }

  /** Рекламодатель подтверждает — списание холда + автовыплата блогеру по СБП */
  async release(dealId: string, user: User, isAdmin = false) {
    const deal = await this.loadForParticipant(dealId, user.id, true, isAdmin);
    const isAdvertiser = deal.advertiserUserId === user.id;
    if (!isAdvertiser && !isAdmin) {
      throw new ForbiddenException('Подтвердить сделку может только рекламодатель');
    }
    if (![SafeDealStatus.FUNDED, SafeDealStatus.IN_PROGRESS, SafeDealStatus.DELIVERED, SafeDealStatus.DISPUTED].includes(deal.status)) {
      throw new BadRequestException('Сделку в текущем статусе нельзя завершить');
    }

    // Двухстадийный платёж в холде — подтверждаем списание
    if (deal.isTwoStage && deal.tbankStatus === 'AUTHORIZED' && deal.tbankPaymentId) {
      const res = await this.tbank.confirm(deal.tbankPaymentId, deal.amount);
      if (!res.success) {
        throw new BadRequestException(res.message || 'Не удалось подтвердить списание в банке');
      }
      deal.tbankStatus = 'CONFIRMED';
    }

    deal.status = SafeDealStatus.RELEASED;
    deal.releasedAt = new Date();
    await this.dealRepo.save(deal);

    // Автовыплата блогеру (E2C / СБП)
    await this.attemptBloggerPayout(deal);

    const payoutHint =
      deal.payoutStatus === 'completed'
        ? `Выплата ${deal.payoutAmount}₽ отправлена на ваш СБП.`
        : deal.payoutStatus === 'pending'
          ? `Выплата ${deal.payoutAmount}₽ в обработке банком.`
          : deal.payoutStatus === 'failed'
            ? `Выплата ${deal.payoutAmount}₽ не прошла автоматически — поддержка разберётся. ${deal.payoutError || ''}`
            : `К выплате: ${deal.payoutAmount}₽ (комиссия ${deal.commissionAmount}₽).`;

    await this.notify(
      deal.bloggerUserId,
      `🎉 <b>Сделка завершена</b>\n\nРекламодатель подтвердил выполнение.\n${payoutHint}`,
      this.dealButton(deal.id),
    );
    await this.notify(
      deal.advertiserUserId,
      `🎉 <b>Сделка завершена</b>\n\nСпасибо! Средства направлены блогеру.`,
    );
    return this.toPublic(deal);
  }

  /**
   * Автовыплата блогеру через E2C СБП.
   * Не бросает наружу — ошибки пишутся в deal.payoutStatus=failed.
   */
  async attemptBloggerPayout(deal: SafeDeal): Promise<SafeDeal> {
    if (['completed', 'pending'].includes(deal.payoutStatus || '')) {
      return deal;
    }
    if (!this.e2c.isConfigured()) {
      deal.payoutStatus = 'skipped';
      deal.payoutError = 'Выплатной терминал не настроен (TBANK_PAYOUT_*)';
      await this.dealRepo.save(deal);
      return deal;
    }

    const blogger = await this.userRepo.findOne({ where: { id: deal.bloggerUserId } });
    if (!blogger) {
      deal.payoutStatus = 'failed';
      deal.payoutError = 'Блогер не найден';
      await this.dealRepo.save(deal);
      return deal;
    }

    const phone = normalizePayoutPhone(blogger.payoutPhone || blogger.phone);
    const sbpMemberId = blogger.payoutSbpMemberId?.trim();
    if (!phone || !sbpMemberId) {
      deal.payoutStatus = 'failed';
      deal.payoutError =
        'У блогера не указаны реквизиты СБП (телефон + банк). Нужно заполнить в профиле.';
      await this.dealRepo.save(deal);
      await this.notify(
        blogger.id,
        `⚠️ <b>Не удалось выплатить автоматически</b>\n\nУкажите в профиле телефон и банк СБП для получения ${deal.payoutAmount}₽.`,
      );
      await this.notifyAdmins(
        `⚠️ Автовыплата не удалась\nСделка: ${deal.id}\nСумма: ${deal.payoutAmount}₽\nПричина: нет реквизитов СБП у блогера`,
      );
      return deal;
    }

    const orderId = `payout-${deal.id.slice(0, 8)}-${Date.now()}`;
    deal.payoutStatus = 'pending';
    deal.payoutOrderId = orderId;
    deal.payoutError = undefined;
    await this.dealRepo.save(deal);

    const res = await this.e2c.payoutSbp({
      amount: Number(deal.payoutAmount),
      orderId,
      phone,
      sbpMemberId,
      paymentRecipientId: phone,
    });

    if (!res.success) {
      deal.payoutStatus = 'failed';
      deal.payoutBankStatus = res.status;
      deal.payoutError = res.message || res.errorCode || 'Банк отклонил выплату';
      await this.dealRepo.save(deal);
      await this.notifyAdmins(
        `❌ Автовыплата failed\nСделка: ${deal.id}\nСумма: ${deal.payoutAmount}₽\n${deal.payoutError}`,
      );
      return deal;
    }

    deal.payoutPaymentId = res.paymentId;
    deal.payoutBankStatus = res.status;
    const done =
      res.status === 'COMPLETED' ||
      res.status === 'CHECKED' ||
      res.status === 'CONFIRMED';
    if (done) {
      deal.payoutStatus = 'completed';
      deal.paidOutAt = new Date();
      deal.payoutError = undefined;
    } else if (res.status === 'REJECTED') {
      deal.payoutStatus = 'failed';
      deal.payoutError = 'Банк отклонил выплату (REJECTED)';
    } else {
      // COMPLETING / CREDIT_CHECKING — ждём webhook
      deal.payoutStatus = 'pending';
    }
    await this.dealRepo.save(deal);

    if (deal.payoutStatus === 'failed') {
      await this.notifyAdmins(
        `❌ Автовыплата REJECTED\nСделка: ${deal.id}\nСумма: ${deal.payoutAmount}₽`,
      );
    }
    return deal;
  }

  async adminRetryPayout(dealId: string) {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Сделка не найдена');
    if (deal.status !== SafeDealStatus.RELEASED) {
      throw new BadRequestException('Повторная выплата только для завершённых сделок');
    }
    if (deal.payoutStatus === 'completed') {
      throw new BadRequestException('Выплата уже выполнена');
    }
    deal.payoutStatus = 'none';
    deal.payoutError = undefined;
    deal.payoutPaymentId = undefined;
    deal.payoutOrderId = undefined;
    deal.payoutBankStatus = undefined;
    await this.dealRepo.save(deal);
    await this.attemptBloggerPayout(deal);
    if (deal.payoutStatus === 'completed' || deal.payoutStatus === 'pending') {
      await this.notify(
        deal.bloggerUserId,
        `💸 <b>Выплата отправлена</b>\n\n${deal.payoutAmount}₽ на ваш СБП.`,
        this.dealButton(deal.id),
      );
    }
    return this.toPublic(deal);
  }

  async listPayoutDeals(filter?: 'failed' | 'pending' | 'all') {
    const qb = this.dealRepo
      .createQueryBuilder('deal')
      .where('deal.status = :st', { st: SafeDealStatus.RELEASED })
      .orderBy('deal.updatedAt', 'DESC')
      .take(100);
    if (filter === 'failed') {
      qb.andWhere('deal.payoutStatus = :ps', { ps: 'failed' });
    } else if (filter === 'pending') {
      qb.andWhere('deal.payoutStatus IN (:...ps)', { ps: ['pending', 'none', 'skipped'] });
    } else {
      qb.andWhere('deal.payoutStatus != :ps', { ps: 'none' });
    }
    const deals = await qb.getMany();
    return deals.map((d) => this.toPublic(d));
  }

  /** Webhook статусов E2C-выплаты */
  async handlePayoutNotification(body: Record<string, any>): Promise<string> {
    if (!this.e2c.verifyNotification(body)) {
      this.logger.warn('E2C notification: invalid token, ignoring');
      return 'OK';
    }
    const orderId = String(body.OrderId || '');
    if (!orderId) return 'OK';

    const deal = await this.dealRepo.findOne({ where: { payoutOrderId: orderId } });
    if (!deal) {
      this.logger.warn(`E2C notification: deal not found for orderId=${orderId}`);
      return 'OK';
    }

    const status = String(body.Status || '');
    deal.payoutBankStatus = status;
    if (body.PaymentId) deal.payoutPaymentId = String(body.PaymentId);

    if (status === 'COMPLETED' || status === 'CHECKED' || status === 'CONFIRMED') {
      const wasDone = deal.payoutStatus === 'completed';
      deal.payoutStatus = 'completed';
      deal.paidOutAt = deal.paidOutAt || new Date();
      deal.payoutError = undefined;
      await this.dealRepo.save(deal);
      if (!wasDone) {
        await this.notify(
          deal.bloggerUserId,
          `💸 <b>Выплата получена</b>\n\n${deal.payoutAmount}₽ зачислены на ваш СБП.`,
          this.dealButton(deal.id),
        );
      }
    } else if (status === 'REJECTED') {
      deal.payoutStatus = 'failed';
      deal.payoutError = body.Message || 'Банк отклонил выплату';
      await this.dealRepo.save(deal);
      await this.notifyAdmins(
        `❌ E2C REJECTED\nСделка: ${deal.id}\n${deal.payoutError}`,
      );
    } else {
      await this.dealRepo.save(deal);
    }
    return 'OK';
  }

  private async notifyAdmins(text: string) {
    const adminIds = this.configService.get<number[]>('app.admins.telegramIds') || [];
    for (const adminTgId of adminIds) {
      try {
        await this.telegram.sendMessage(adminTgId, text);
      } catch {
        /* ignore */
      }
    }
  }

  listSbpBanks() {
    return this.e2c.getSbpMembers();
  }

  /** Любая сторона открывает спор */
  async openDispute(dealId: string, user: User, reason?: string) {
    const deal = await this.loadForParticipant(dealId, user.id);
    if (![SafeDealStatus.FUNDED, SafeDealStatus.IN_PROGRESS, SafeDealStatus.DELIVERED].includes(deal.status)) {
      throw new BadRequestException('Спор можно открыть только по оплаченной сделке');
    }
    deal.status = SafeDealStatus.DISPUTED;
    deal.disputedAt = new Date();
    if (reason) deal.disputeReason = reason.slice(0, 2000);
    await this.dealRepo.save(deal);

    const other = deal.advertiserUserId === user.id ? deal.bloggerUserId : deal.advertiserUserId;
    await this.notify(
      other,
      `⚠️ <b>По сделке открыт спор</b>\n\n${reason ? `Причина: ${reason}` : 'Причина не указана.'}\nМодератор платформы рассмотрит ситуацию.`,
      this.dealButton(deal.id),
    );

    // Уведомляем админов
    const adminIds = this.configService.get<number[]>('app.admins.telegramIds') || [];
    for (const adminTgId of adminIds) {
      try {
        await this.telegram.sendMessage(
          adminTgId,
          `⚠️ <b>Спор по сделке</b>\nСумма: ${deal.amount}₽\nID: ${deal.id}\n${reason ? `Причина: ${reason}` : ''}`,
        );
      } catch {
        // ignore
      }
    }
    return this.toPublic(deal);
  }

  /** Админ: возврат средств рекламодателю */
  async adminRefund(dealId: string) {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Сделка не найдена');
    if (deal.status === SafeDealStatus.RELEASED) {
      throw new BadRequestException('Средства уже выплачены блогеру — возврат невозможен');
    }
    if (deal.paymentMethod !== 'crypto' && deal.tbankPaymentId) {
      const res = await this.tbank.cancel(deal.tbankPaymentId, deal.amount);
      if (!res.success) {
        throw new BadRequestException(res.message || 'Банк отклонил возврат');
      }
    }
    deal.status = SafeDealStatus.REFUNDED;
    deal.refundedAt = new Date();
    await this.dealRepo.save(deal);

    await this.notify(
      deal.advertiserUserId,
      `↩️ <b>Возврат по сделке</b>\n\nМодератор вернул вам ${deal.amount}₽.`,
    );
    await this.notify(
      deal.bloggerUserId,
      `ℹ️ <b>Сделка закрыта возвратом</b>\n\nМодератор принял решение вернуть средства рекламодателю.`,
    );
    return this.toPublic(deal);
  }

  // ─────────────────────────────────────────────────────────────
  // Крипто-кошельки и ручное подтверждение
  // ─────────────────────────────────────────────────────────────

  async listActiveWallets() {
    const wallets = await this.walletRepo.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
    return wallets.map((w) => ({
      id: w.id,
      label: w.label,
      network: w.network,
      currency: w.currency,
      address: w.address,
    }));
  }

  async listAllWallets() {
    return this.walletRepo.find({ order: { createdAt: 'DESC' } });
  }

  async upsertWallet(data: {
    id?: string;
    label: string;
    network: string;
    currency: string;
    address: string;
    isActive?: boolean;
    notes?: string;
  }) {
    if (!data.label?.trim() || !data.address?.trim()) {
      throw new BadRequestException('Укажите название и адрес кошелька');
    }
    let wallet: CryptoWallet;
    if (data.id) {
      const existing = await this.walletRepo.findOne({ where: { id: data.id } });
      if (!existing) throw new NotFoundException('Кошелёк не найден');
      wallet = existing;
    } else {
      wallet = this.walletRepo.create();
    }
    wallet.label = data.label.trim().slice(0, 64);
    wallet.network = (data.network || 'TRC20').slice(0, 16);
    wallet.currency = (data.currency || 'USDT').slice(0, 16);
    wallet.address = data.address.trim().slice(0, 256);
    wallet.isActive = data.isActive !== false;
    wallet.notes = data.notes?.trim() || undefined;
    return this.walletRepo.save(wallet);
  }

  async deleteWallet(id: string) {
    const wallet = await this.walletRepo.findOne({ where: { id } });
    if (!wallet) throw new NotFoundException('Кошелёк не найден');
    wallet.isActive = false;
    await this.walletRepo.save(wallet);
    return { success: true };
  }

  /** Рекламодатель отправляет hash транзакции */
  async submitCryptoTx(dealId: string, user: User, txHash: string) {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Сделка не найдена');
    if (deal.advertiserUserId !== user.id) {
      throw new ForbiddenException('Только плательщик может указать hash');
    }
    if (deal.paymentMethod !== 'crypto') {
      throw new BadRequestException('Сделка оплачивается не криптой');
    }
    if (!txHash?.trim() || txHash.trim().length < 8) {
      throw new BadRequestException('Укажите корректный hash транзакции');
    }
    deal.cryptoTxHash = txHash.trim().slice(0, 256);
    await this.dealRepo.save(deal);

    const adminIds = this.configService.get<number[]>('app.admins.telegramIds') || [];
    for (const adminTgId of adminIds) {
      try {
        await this.telegram.sendMessage(
          adminTgId,
          `💎 <b>Hash по крипто-сделке</b>\nID: ${deal.id}\nTX: <code>${deal.cryptoTxHash}</code>\nСумма: ${deal.amount}₽`,
        );
      } catch {
        /* ignore */
      }
    }
    return this.toPublic(deal);
  }

  /** Админ вручную подтверждает поступление крипты → FUNDED */
  async adminConfirmCrypto(dealId: string) {
    const deal = await this.dealRepo.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Сделка не найдена');
    if (deal.paymentMethod !== 'crypto') {
      throw new BadRequestException('Это не крипто-сделка');
    }
    if (![SafeDealStatus.AWAITING_PAYMENT, SafeDealStatus.CREATED].includes(deal.status as SafeDealStatus)) {
      throw new BadRequestException(`Нельзя подтвердить сделку в статусе ${deal.status}`);
    }
    deal.status = SafeDealStatus.FUNDED;
    deal.paidAt = new Date();
    await this.dealRepo.save(deal);

    await this.notify(
      deal.advertiserUserId,
      `✅ <b>Крипто-оплата подтверждена</b>\n\nСредства под гарантией платформы. Блогер может приступать к работе.`,
      this.dealButton(deal.id),
    );
    await this.notify(
      deal.bloggerUserId,
      `✅ <b>Сделка оплачена (крипта)</b>\n\nМожете приступать к работе.`,
      this.dealButton(deal.id),
    );
    return this.toPublic(deal);
  }

  async listCryptoDeals() {
    const deals = await this.dealRepo.find({
      where: { paymentMethod: 'crypto' },
      order: { updatedAt: 'DESC' },
      take: 100,
    });
    return deals.map((d) => this.toPublic(d));
  }
}

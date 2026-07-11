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
import { Offer, OfferStatus } from '../offers/entities/offer.entity';
import { User } from '../users/entities/user.entity';
import { TBankService } from './tbank.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class SafeDealsService implements OnModuleInit {
  private readonly logger = new Logger(SafeDealsService.name);

  constructor(
    @InjectRepository(SafeDeal)
    private readonly dealRepo: Repository<SafeDeal>,
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly tbank: TBankService,
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
      advertiserUserId: deal.advertiserUserId,
      bloggerUserId: deal.bloggerUserId,
      title: deal.title,
      amount: Number(deal.amount),
      commissionAmount: Number(deal.commissionAmount),
      payoutAmount: Number(deal.payoutAmount),
      status: deal.status,
      paymentUrl: deal.paymentUrl,
      tbankStatus: deal.tbankStatus,
      isTwoStage: deal.isTwoStage,
      deliveryNote: deal.deliveryNote,
      disputeReason: deal.disputeReason,
      paidAt: deal.paidAt,
      deliveredAt: deal.deliveredAt,
      releasedAt: deal.releasedAt,
      refundedAt: deal.refundedAt,
      disputedAt: deal.disputedAt,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    };
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
    // FRONTEND_URL важнее (успех/ошибка оплаты открываются в браузере пользователя).
    // app.frontendUrl по умолчанию = localhost, поэтому не полагаемся на него:
    // если env не задан — используем адрес мини-приложения из конфига Telegram.
    const fromEnv = process.env.FRONTEND_URL;
    if (fromEnv) return fromEnv;
    const webApp = this.configService.get<string>('app.telegram.webAppUrl');
    if (webApp) return webApp;
    return 'https://influentaa.vercel.app';
  }

  private backendUrl(): string {
    return (
      this.configService.get<string>('app.backendUrl') ||
      'https://web-production-2bad2.up.railway.app'
    );
  }

  private dealButton(dealId: string, text = 'Открыть сделку') {
    return {
      inline_keyboard: [
        [{ text, web_app: { url: `${this.frontendUrl()}/safe-deals/${dealId}` } }],
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // Создание сделки и инициализация оплаты (рекламодатель)
  // ─────────────────────────────────────────────────────────────
  async createForOffer(offerId: string, user: User) {
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

    // Новый orderId на каждую попытку оплаты
    const orderId = randomUUID().replace(/-/g, '');

    const initResult = await this.tbank.init({
      amount,
      orderId,
      description: `Безопасная сделка: ${deal.title}`.slice(0, 250),
      notificationUrl: `${this.backendUrl()}/payments/tbank/webhook`,
      successUrl: `${this.frontendUrl()}/payment/success?dealId=${deal.id}`,
      failUrl: `${this.frontendUrl()}/payment/fail?dealId=${deal.id}`,
    });

    if (!initResult.success || !initResult.paymentUrl) {
      throw new BadRequestException(initResult.message || 'Не удалось создать платёж');
    }

    deal.tbankOrderId = orderId;
    deal.tbankPaymentId = initResult.paymentId;
    deal.paymentUrl = initResult.paymentUrl;
    deal.status = SafeDealStatus.AWAITING_PAYMENT;
    deal = await this.dealRepo.save(deal);

    return { deal: this.toPublic(deal), paymentUrl: initResult.paymentUrl };
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

  /** Рекламодатель подтверждает — релиз средств блогеру */
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

    await this.notify(
      deal.bloggerUserId,
      `🎉 <b>Сделка завершена</b>\n\nРекламодатель подтвердил выполнение. К выплате: ${deal.payoutAmount}₽ (комиссия платформы ${deal.commissionAmount}₽).`,
      this.dealButton(deal.id),
    );
    await this.notify(
      deal.advertiserUserId,
      `🎉 <b>Сделка завершена</b>\n\nСпасибо! Средства направлены блогеру.`,
    );
    return this.toPublic(deal);
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
    if (deal.tbankPaymentId) {
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
}

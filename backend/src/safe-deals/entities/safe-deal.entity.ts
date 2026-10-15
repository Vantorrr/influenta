import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
  ValueTransformer,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Offer } from '../../offers/entities/offer.entity';

export enum SafeDealStatus {
  /** Сделка создана, оплата ещё не инициирована */
  CREATED = 'created',
  /** Платёж инициирован в T-Bank, ждём оплату */
  AWAITING_PAYMENT = 'awaiting_payment',
  /** Деньги захолдированы/захвачены — средства под гарантией платформы */
  FUNDED = 'funded',
  /** Блогер приступил к работе */
  IN_PROGRESS = 'in_progress',
  /** Блогер отметил работу выполненной, ждём подтверждения рекламодателя */
  DELIVERED = 'delivered',
  /** Рекламодатель подтвердил — средства разблокированы в пользу блогера */
  RELEASED = 'released',
  /** Открыт спор */
  DISPUTED = 'disputed',
  /** Возврат средств рекламодателю */
  REFUNDED = 'refunded',
  /** Сделка отменена (платёж не прошёл / истёк) */
  CANCELLED = 'cancelled',
}

/** numeric(10,2) в Postgres возвращается строкой — приводим к number */
const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value ?? null,
  from: (value?: string | null) =>
    value === null || value === undefined ? 0 : parseFloat(value as unknown as string),
};

@Entity('safe_deals')
export class SafeDeal extends BaseEntity {
  @Index('idx_safe_deals_offer_id')
  @Column({ type: 'uuid', nullable: true })
  offerId?: string;

  @ManyToOne(() => Offer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'offerId' })
  offer?: Offer;

  /** Отклик на объявление, из которого создана сделка (альтернатива offerId) */
  @Index('idx_safe_deals_response_id')
  @Column({ type: 'uuid', nullable: true })
  responseId?: string;

  /** Объявление (для навигации/отображения), когда сделка из отклика */
  @Column({ type: 'uuid', nullable: true })
  listingId?: string;

  /** Плательщик (рекламодатель) — User.id */
  @Index('idx_safe_deals_advertiser')
  @Column({ type: 'uuid' })
  advertiserUserId: string;

  /** Получатель (блогер) — User.id */
  @Index('idx_safe_deals_blogger')
  @Column({ type: 'uuid' })
  bloggerUserId: string;

  @Column({ type: 'varchar', nullable: true })
  title?: string;

  /** Сумма сделки (что платит рекламодатель), ₽ */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  amount: number;

  /** Комиссия платформы, ₽ */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  commissionAmount: number;

  /** Сумма к выплате блогеру, ₽ */
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0, transformer: decimalTransformer })
  payoutAmount: number;

  @Index('idx_safe_deals_status')
  @Column({ type: 'varchar', default: SafeDealStatus.CREATED })
  status: SafeDealStatus;

  @Column({ type: 'varchar', nullable: true })
  tbankPaymentId?: string;

  @Index('idx_safe_deals_order_id')
  @Column({ type: 'varchar', nullable: true })
  tbankOrderId?: string;

  @Column({ type: 'varchar', nullable: true })
  tbankStatus?: string;

  @Column({ type: 'text', nullable: true })
  paymentUrl?: string;

  /** Способ оплаты: card (T-Bank) или crypto (ручное подтверждение) */
  @Column({ type: 'varchar', length: 16, default: 'card' })
  paymentMethod: 'card' | 'crypto' | string;

  @Column({ type: 'uuid', nullable: true })
  cryptoWalletId?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  cryptoNetwork?: string;

  @Column({ type: 'varchar', length: 16, nullable: true })
  cryptoCurrency?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  cryptoAddress?: string;

  /** Сумма в крипте (как указал рекламодатель / админ), строкой для точности */
  @Column({ type: 'varchar', length: 64, nullable: true })
  cryptoAmount?: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  cryptoTxHash?: string;

  /** true — платёж двухстадийный (деньги в холде, требуется Confirm) */
  @Column({ type: 'boolean', default: false })
  isTwoStage: boolean;

  @Column({ type: 'text', nullable: true })
  deliveryNote?: string;

  @Column({ type: 'text', nullable: true })
  disputeReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  disputedAt?: Date;

  /**
   * Статус автовыплаты блогеру (E2C/СБП):
   * none | pending | completed | failed | skipped
   */
  @Column({ type: 'varchar', length: 24, default: 'none' })
  payoutStatus: string;

  @Column({ type: 'varchar', nullable: true })
  payoutPaymentId?: string;

  @Column({ type: 'varchar', nullable: true })
  payoutOrderId?: string;

  @Column({ type: 'varchar', nullable: true })
  payoutBankStatus?: string;

  @Column({ type: 'text', nullable: true })
  payoutError?: string;

  @Column({ type: 'timestamptz', nullable: true })
  paidOutAt?: Date;
}

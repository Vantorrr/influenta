import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Advertiser } from '../../advertisers/entities/advertiser.entity';
import { BloggerCategory } from '../../bloggers/entities/blogger.entity';

export enum ListingStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum PostFormat {
  POST = 'post',
  STORY = 'story',
  LIVE = 'live',
  POST_AND_STORY = 'post_and_story',
  ANY = 'any',
}

@Entity('listings')
export class Listing extends BaseEntity {
  @ManyToOne(() => Advertiser)
  @JoinColumn()
  advertiser: Advertiser;

  @Column()
  advertiserId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: BloggerCategory,
    array: true,
    default: [],
  })
  targetCategories: BloggerCategory[];

  @Index('idx_listings_budget')
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  budget: number;

  @Index('idx_listings_format')
  @Column({
    type: 'enum',
    enum: PostFormat,
    default: PostFormat.ANY,
  })
  format: PostFormat;

  @Column({ type: 'jsonb', nullable: true })
  requirements: {
    minSubscribers?: number;
    maxSubscribers?: number;
    verifiedOnly?: boolean;
  };

  @Column({ type: 'date', nullable: true })
  deadline: Date;

  @Index('idx_listings_status')
  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  responsesCount: number;

  // Безопасная сделка: средства держатся на эскроу-счёте до подтверждения выполнения
  @Column({ default: false })
  useSafeDeal: boolean;

  /**
   * Закреп объявления — отдельная платная услуга (не связана с useSafeDeal).
   * Пользователь может запросить закреп (pinRequested), админ активирует после оплаты.
   */
  @Index('idx_listings_is_pinned')
  @Column({ default: false })
  isPinned: boolean;

  /** Запрошен закреп, ждёт оплаты / подтверждения админом */
  @Column({ default: false })
  pinRequested: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  pinnedUntil?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  additionalInfo: Record<string, any>;
}


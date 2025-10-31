import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum PlatformType {
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  VK = 'vk',
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  TWITCH = 'twitch',
  LINKEDIN = 'linkedin',
  OTHER = 'other',
}

@Entity('social_platforms')
@Index(['userId', 'platform'], { unique: true }) // One platform type per user
export class SocialPlatform extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;

  @Column()
  username: string; // @username or channel name

  @Column({ nullable: true })
  url?: string; // Full URL to profile

  @Column({ default: 0 })
  subscribersCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerPost?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerStory?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerReel?: number; // For Instagram Reels, YouTube Shorts, TikTok videos

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerStream?: number; // For Twitch, YouTube streams

  @Column({ type: 'jsonb', default: [] })
  statisticsScreenshots: string[]; // URLs to uploaded screenshots

  @Column({ type: 'jsonb', nullable: true })
  additionalInfo?: {
    averageViews?: number;
    engagementRate?: number;
    audienceAge?: string; // "18-24", "25-34", etc.
    audienceGender?: string; // "70% female, 30% male"
    audienceLocation?: string; // "Russia 80%, USA 10%"
    contentLanguage?: string; // "ru", "en", etc.
    verificationStatus?: string; // Platform-specific verification
    lastUpdated?: Date;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isPrimary: boolean; // Main platform for the blogger
}


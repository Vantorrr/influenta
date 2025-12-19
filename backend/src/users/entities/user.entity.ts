import { Entity, Column, OneToOne, OneToMany, ValueTransformer, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  BLOGGER = 'blogger',
  ADVERTISER = 'advertiser',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  // Transformer to map Postgres BIGINT (string) <-> number in JS
  private static readonly bigIntToNumber: ValueTransformer = {
    to: (value: number | null | undefined) => value ?? null,
    from: (value: string | null) => (value === null || value === undefined ? null : parseInt(value as unknown as string, 10)),
  };
  @Column({ unique: true })
  telegramId: string;

  @Column({ nullable: true })
  username?: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ unique: true, nullable: true })
  email?: string;

  @Column({ nullable: true })
  @Exclude()
  password?: string;

  @Column({ nullable: true })
  languageCode?: string;

  @Column({ nullable: true, type: 'text' })
  bio?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  telegramLink?: string;

  @Column({ nullable: true })
  instagramLink?: string;

  // Поля для блогеров
  @Index('idx_users_subscribers_count')
  @Column({ nullable: true, type: 'bigint', transformer: User.bigIntToNumber })
  subscribersCount?: number | null;

  @Column({ nullable: true, type: 'bigint', transformer: User.bigIntToNumber })
  pricePerPost?: number | null;

  @Column({ nullable: true, type: 'bigint', transformer: User.bigIntToNumber })
  pricePerStory?: number | null;

  @Column({ nullable: true })
  categories?: string;

  // Поля для рекламодателей
  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Index('idx_users_role')
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BLOGGER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Index('idx_users_is_verified')
  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  onboardingCompleted: boolean;

  @Column({ default: false })
  verificationRequested: boolean;

  @Column({ nullable: true })
  verificationRequestedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  verificationData?: {
    documents?: string[]; // URLs документов
    socialProofs?: {
      platform: string;
      url: string;
      followers?: number;
    }[];
    message?: string;
    verificationCode?: string; // Код для вставки в описание соцсети
    rejectionReason?: string;
  };

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  telegramData?: Record<string, any>;
}


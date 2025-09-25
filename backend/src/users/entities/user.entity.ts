import { Entity, Column, OneToOne, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';

export enum UserRole {
  BLOGGER = 'blogger',
  ADVERTISER = 'advertiser',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
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
  @Column({ nullable: true, type: 'int' })
  subscribersCount?: number;

  @Column({ nullable: true, type: 'int' })
  pricePerPost?: number;

  @Column({ nullable: true, type: 'int' })
  pricePerStory?: number;

  @Column({ nullable: true })
  categories?: string;

  // Поля для рекламодателей
  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BLOGGER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  telegramData?: Record<string, any>;
}


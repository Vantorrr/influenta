import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum BloggerCategory {
  LIFESTYLE = 'lifestyle',
  TECH = 'tech',
  BEAUTY = 'beauty',
  FASHION = 'fashion',
  FOOD = 'food',
  TRAVEL = 'travel',
  FITNESS = 'fitness',
  GAMING = 'gaming',
  EDUCATION = 'education',
  BUSINESS = 'business',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other',
}

@Entity('bloggers')
export class Blogger extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: BloggerCategory,
    array: true,
    default: [],
  })
  categories: BloggerCategory[];

  @Column({ default: 0 })
  subscribersCount: number;

  @Column({ default: 0 })
  averageViews: number;

  @Column({ default: 0 })
  engagementRate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerPost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerStory: number;

  @Column({ type: 'jsonb', default: [] })
  postExamples: Array<{
    url: string;
    description: string;
    views: number;
    date: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  contacts: {
    telegram?: string;
    whatsapp?: string;
    email?: string;
    phone?: string;
  };

  @Column({ default: true })
  isPublic: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  completedCampaigns: number;
}


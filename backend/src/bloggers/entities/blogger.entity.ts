import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum BloggerCategory {
  HUMOR = 'humor',
  FOOD = 'food',
  FITNESS = 'fitness',
  EDUCATION = 'education',
  GAMING = 'gaming',
  TECH = 'tech',
  FASHION = 'fashion',
  LIFESTYLE = 'lifestyle',
  BEAUTY = 'beauty',
  BUSINESS = 'business',
  HOBBY = 'hobby',
  TRAVEL = 'travel',
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
}


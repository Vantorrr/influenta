import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('advertisers')
export class Advertiser extends BaseEntity {
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column()
  companyName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  website: string;

  @Column({ type: 'jsonb', nullable: true })
  contacts: {
    telegram?: string;
    whatsapp?: string;
    email?: string;
    phone?: string;
  };

  @Column({ type: 'jsonb', default: [] })
  campaignHistory: Array<{
    title: string;
    description: string;
    budget: number;
    date: Date;
    bloggersCount: number;
  }>;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  completedCampaigns: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalSpent: number;
}


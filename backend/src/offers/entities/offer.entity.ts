import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Blogger } from '@/bloggers/entities/blogger.entity';
import { User } from '@/users/entities/user.entity';

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Advertiser, { eager: true })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: Advertiser;

  @Column()
  advertiserId: string;

  @ManyToOne(() => Blogger, { eager: true })
  @JoinColumn({ name: 'bloggerId' })
  blogger: Blogger;

  @Column()
  bloggerId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  proposedBudget: number;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.PENDING })
  status: OfferStatus;

  @Column({ nullable: true })
  projectTitle?: string;

  @Column({ nullable: true })
  projectDescription?: string;

  @Column({ nullable: true })
  format?: string; // post, story, live, etc.

  @Column({ nullable: true })
  deadline?: Date;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @Column({ nullable: true })
  rejectedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

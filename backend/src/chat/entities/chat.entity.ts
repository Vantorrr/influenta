import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { Offer } from '@/offers/entities/offer.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  bloggerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'bloggerId' })
  blogger: User;

  @Column({ nullable: true })
  advertiserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'advertiserId' })
  advertiser: User;

  @Column({ nullable: true })
  listingId?: string;

  @ManyToOne(() => Listing, { nullable: true })
  @JoinColumn({ name: 'listingId' })
  listing: Listing;

  @Column({ nullable: true })
  offerId?: string;

  @ManyToOne(() => Offer, { nullable: true })
  @JoinColumn({ name: 'offerId' })
  offer: Offer;

  @Column({ type: 'jsonb', default: [] })
  messages: any[];

  @Column({ default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

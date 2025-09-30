import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Listing } from '@/listings/entities/listing.entity';

export type ResponseStatus = 'pending' | 'accepted' | 'rejected';

@Entity('responses')
export class Response {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Listing)
  listing: Listing;

  @ManyToOne(() => User)
  blogger: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'enum', enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: ResponseStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Blogger } from '../../bloggers/entities/blogger.entity';
import { Listing } from '../../listings/entities/listing.entity';

export enum ResponseStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Entity('responses')
export class Response extends BaseEntity {
  @ManyToOne(() => Listing)
  @JoinColumn()
  listing: Listing;

  @Column()
  listingId: string;

  @ManyToOne(() => Blogger)
  @JoinColumn()
  blogger: Blogger;

  @Column()
  bloggerId: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  proposedPrice: number;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.PENDING,
  })
  status: ResponseStatus;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  acceptedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  proposalDetails: {
    deliveryTime?: number; // в днях
    examples?: string[];
    additionalServices?: string[];
  };
}


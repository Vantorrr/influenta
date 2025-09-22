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


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
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Listing } from '@/listings/entities/listing.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  blogger: User;

  @ManyToOne(() => User)
  advertiser: User;

  @ManyToOne(() => Listing)
  listing: Listing;

  @Column({ type: 'jsonb', default: [] })
  messages: any[];

  @Column({ default: 0 })
  unreadCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

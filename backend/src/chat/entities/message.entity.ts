import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Response } from '../../responses/entities/response.entity';

@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => Response)
  @JoinColumn()
  response: Response;

  @Column()
  responseId: string;

  @ManyToOne(() => User)
  @JoinColumn()
  sender: User;

  @Column()
  senderId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ nullable: true })
  readAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  attachments: Array<{
    type: 'image' | 'document' | 'link';
    url: string;
    name?: string;
    size?: number;
  }>;
}


import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('favorites')
@Unique(['userId', 'bloggerId']) // Один блогер может быть в избранном только один раз
@Index(['userId'])
export class Favorite extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  @Index()
  userId: string; // Кто добавил в избранное (рекламодатель)

  @Column()
  @Index()
  bloggerId: string; // Кого добавили (блогер)
}




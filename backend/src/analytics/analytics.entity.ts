import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';

export type AnalyticsEventName =
  | 'app_open'
  | 'dashboard_view'
  | 'profile_view'
  | 'profile_edit_save'
  | 'listing_view'
  | 'listings_list_view'
  | 'bloggers_list_view'
  | 'quick_action_click'
  | 'cta_click'
  | 'onboarding_complete'
  | 'listing_create_open'
  | 'listing_create_submit';

@Entity('analytics_events')
export class AnalyticsEvent extends BaseEntity {
  @Column({ type: 'varchar' })
  userId: string; // кто совершил действие

  @Column({ type: 'varchar' })
  event: AnalyticsEventName;

  @Column({ type: 'varchar', nullable: true })
  targetType?: string | null; // 'user' | 'listing' | etc

  @Column({ type: 'varchar', nullable: true })
  targetId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  targetUserId?: string | null; // чьего пользователя касалось

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any> | null;
}









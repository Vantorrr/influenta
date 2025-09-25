import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent, AnalyticsEventName } from './analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private repo: Repository<AnalyticsEvent>,
  ) {}

  async track(params: {
    userId: string
    event: AnalyticsEventName
    targetType?: string
    targetId?: string
    targetUserId?: string
    metadata?: Record<string, any>
  }) {
    const ev = this.repo.create({ ...params })
    return this.repo.save(ev)
  }
}



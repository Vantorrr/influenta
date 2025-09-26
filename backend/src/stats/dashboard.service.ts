import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThan } from 'typeorm'
import { AnalyticsEvent } from '@/analytics/analytics.entity'

@Injectable()
export class DashboardStatsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  async getDashboard(userId: string) {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const profileViews = await this.analyticsRepo.count({ where: { event: 'profile_view', targetUserId: userId, createdAt: MoreThan(since) } })
    const activeResponses = 0
    const earnings = 0
    const rating = 0

    return {
      profileViews,
      activeResponses,
      earnings,
      rating,
      recentActivity: [],
    }
  }
}



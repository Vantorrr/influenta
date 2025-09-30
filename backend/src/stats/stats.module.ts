import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StatsController } from './stats.controller'
import { DashboardStatsService } from './dashboard.service'
import { AnalyticsEvent } from '@/analytics/analytics.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [StatsController],
  providers: [DashboardStatsService],
})
export class StatsModule {}





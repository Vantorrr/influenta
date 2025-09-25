import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StatsController } from './stats.controller'
import { StatsService } from './stats.service'
import { AnalyticsEvent } from '@/analytics/analytics.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}

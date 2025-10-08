import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { StatsController } from './stats.controller'
import { DashboardStatsService } from './dashboard.service'
import { AnalyticsEvent } from '@/analytics/analytics.entity'
import { User } from '@/users/entities/user.entity'
import { Blogger } from '@/bloggers/entities/blogger.entity'
import { Advertiser } from '@/advertisers/entities/advertiser.entity'
import { Listing } from '@/listings/entities/listing.entity'
import { Response } from '@/responses/entities/response.entity'

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEvent, User, Blogger, Advertiser, Listing, Response])],
  controllers: [StatsController],
  providers: [DashboardStatsService],
})
export class StatsModule {}










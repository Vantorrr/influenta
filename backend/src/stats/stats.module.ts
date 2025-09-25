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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { User } from '@/users/entities/user.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { Response } from '@/responses/entities/response.entity';
import { Chat } from '@/chat/entities/chat.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Listing, Response, Chat]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}

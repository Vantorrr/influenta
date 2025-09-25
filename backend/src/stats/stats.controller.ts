import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { User } from '../users/entities/user.entity'
import { StatsService } from './stats.service'

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private service: StatsService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async dashboard(@CurrentUser() user: User) {
    return this.service.getDashboard(user.id)
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  async getDashboardStats(@CurrentUser() user: User) {
    return this.statsService.getDashboardStats(user);
  }
}

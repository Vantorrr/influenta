import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { DashboardStatsService } from './dashboard.service'
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { User } from '@/users/entities/user.entity'

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: DashboardStatsService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async dashboard(@CurrentUser() user: User) {
    return this.statsService.getDashboard(user.id)
  }

  @Get('series')
  @UseGuards(JwtAuthGuard)
  async series(@CurrentUser() user: User) {
    return this.statsService.getSeries(user.id)
  }
}









import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track analytics event' })
  @UseGuards(JwtAuthGuard)
  async track(@CurrentUser() user: User, @Body() body: any) {
    const { event, targetType, targetId, targetUserId, metadata } = body || {}
    const saved = await this.service.track({
      userId: user.id,
      event,
      targetType,
      targetId,
      targetUserId,
      metadata,
    })
    return { success: true, id: saved.id }
  }
}



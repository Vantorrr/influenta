import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return { ok: true }
  }

  // Платформенные метрики для админ-дашборда
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  // Последняя активность (для карточки на дашборде)
  @Get('recent-activity')
  @UseGuards(JwtAuthGuard)
  async recentActivity() {
    return this.adminService.getRecentActivity();
  }

  // Топ блогеры (для карточки на дашборде)
  @Get('top-bloggers')
  @UseGuards(JwtAuthGuard)
  async topBloggers() {
    return this.adminService.getTopBloggers();
  }
}





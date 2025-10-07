import { Controller, Get, UseGuards, Patch, Param, Body, Post } from '@nestjs/common';
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

  // Рекламодатели (для страницы admin/advertisers)
  @Get('advertisers')
  @UseGuards(JwtAuthGuard)
  async advertisers() {
    return this.adminService.getAdvertisersList();
  }

  // Заявки на верификацию (модерация)
  @Get('verification-requests')
  @UseGuards(JwtAuthGuard)
  async verificationRequests() {
    return this.adminService.getVerificationRequests();
  }

  // Одобрить верификацию пользователя
  @Patch('users/:id/verify')
  @UseGuards(JwtAuthGuard)
  async verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }

  // Отклонить верификацию пользователя
  @Patch('users/:id/reject-verification')
  @UseGuards(JwtAuthGuard)
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.rejectVerification(id, body?.reason || 'Недостаточно данных');
  }

  // Синхронизация счётчиков (пересчёт responsesCount для всех объявлений)
  @Post('sync-counters')
  @UseGuards(JwtAuthGuard)
  async syncCounters() {
    return this.adminService.syncListingCounters();
  }

  // Разовая миграция формата объявлений: reels/reel -> live
  @Post('fix-reels')
  @UseGuards(JwtAuthGuard)
  async fixReels() {
    return this.adminService.fixReelsToLive();
  }

  // Админ: список объявлений
  @Get('listings')
  @UseGuards(JwtAuthGuard)
  async getListingsAdmin() {
    return this.adminService.getListingsAdmin();
  }

  // Админ: детали объявления + отклики
  @Get('listings/:id')
  @UseGuards(JwtAuthGuard)
  async getListingDetailAdmin(@Param('id') id: string) {
    return this.adminService.getListingDetailAdmin(id);
  }
}






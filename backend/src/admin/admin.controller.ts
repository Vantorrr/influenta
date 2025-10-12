import { Controller, Get, UseGuards, Patch, Param, Body, Post } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  health() {
    return { ok: true }
  }

  // Платформенные метрики для админ-дашборда
  @Get('stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  // Последняя активность (для карточки на дашборде)
  @Get('recent-activity')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async recentActivity() {
    return this.adminService.getRecentActivity();
  }

  // Топ блогеры (для карточки на дашборде)
  @Get('top-bloggers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async topBloggers() {
    return this.adminService.getTopBloggers();
  }

  // Рекламодатели (для страницы admin/advertisers)
  @Get('advertisers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async advertisers() {
    return this.adminService.getAdvertisersList();
  }

  // Заявки на верификацию (модерация)
  @Get('verification-requests')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verificationRequests() {
    return this.adminService.getVerificationRequests();
  }

  // Одобрить верификацию пользователя
  @Patch('users/:id/verify')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }

  // Отклонить верификацию пользователя
  @Patch('users/:id/reject-verification')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectVerification(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.adminService.rejectVerification(id, body?.reason || 'Недостаточно данных');
  }

  // Синхронизация счётчиков (пересчёт responsesCount для всех объявлений)
  @Post('sync-counters')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async syncCounters() {
    return this.adminService.syncListingCounters();
  }

  // Разовая миграция формата объявлений: reels/reel -> live
  @Post('fix-reels')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async fixReels() {
    return this.adminService.fixReelsToLive();
  }

  // Админ: список объявлений
  @Get('listings')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getListingsAdmin() {
    return this.adminService.getListingsAdmin();
  }

  // Админ: детали объявления + отклики
  @Get('listings/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getListingDetailAdmin(@Param('id') id: string) {
    return this.adminService.getListingDetailAdmin(id);
  }
}








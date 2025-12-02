import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  // Добавить в избранное
  @Post(':bloggerId')
  async add(@Req() req: any, @Param('bloggerId') bloggerId: string) {
    return this.favoritesService.add(req.user.id, bloggerId);
  }

  // Убрать из избранного
  @Delete(':bloggerId')
  async remove(@Req() req: any, @Param('bloggerId') bloggerId: string) {
    await this.favoritesService.remove(req.user.id, bloggerId);
    return { success: true };
  }

  // Переключить состояние
  @Post(':bloggerId/toggle')
  async toggle(@Req() req: any, @Param('bloggerId') bloggerId: string) {
    return this.favoritesService.toggle(req.user.id, bloggerId);
  }

  // Проверить, в избранном ли
  @Get('check/:bloggerId')
  async check(@Req() req: any, @Param('bloggerId') bloggerId: string) {
    const isFavorite = await this.favoritesService.check(req.user.id, bloggerId);
    return { isFavorite };
  }

  // Проверить несколько блогеров
  @Post('check-many')
  async checkMany(@Req() req: any, @Body() body: { bloggerIds: string[] }) {
    const result = await this.favoritesService.checkMany(req.user.id, body.bloggerIds || []);
    return result;
  }

  // Список избранных
  @Get()
  async getList(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getList(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }

  // Количество избранных
  @Get('count')
  async getCount(@Req() req: any) {
    const count = await this.favoritesService.getCount(req.user.id);
    return { count };
  }
}


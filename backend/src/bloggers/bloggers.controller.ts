import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { BloggersService } from './bloggers.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AdminGuard } from '@/common/guards/admin.guard';
import { BloggerSearchQueryDto } from './dto/blogger-search.query.dto';

@Controller('bloggers')
export class BloggersController {
  constructor(private readonly bloggersService: BloggersService) {}

  // Важно: до :id, иначе "debug" попадёт в findOne
  @Get('debug/all-users')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllUsers() {
    return this.bloggersService.getAllUsers();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query() query: BloggerSearchQueryDto) {
    const { page, limit, ...filters } = query
    return this.bloggersService.search(filters as any, { page, limit } as any);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.bloggersService.findOne(id);
  }
}








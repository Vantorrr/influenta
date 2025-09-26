import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { BloggersService } from './bloggers.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { BloggerSearchDto } from './dto/blogger-search.dto';

@Controller('bloggers')
export class BloggersController {
  constructor(private readonly bloggersService: BloggersService) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(
    @Query() searchDto: BloggerSearchDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.bloggersService.search(searchDto, paginationDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    return this.bloggersService.findOne(id);
  }

  @Get('debug/all-users')
  async getAllUsers() {
    return this.bloggersService.getAllUsers();
  }
}

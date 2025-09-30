import { Controller, Get, Post, Body, Query, Param, UseGuards, Put, Delete } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ListingSearchDto } from './dto/listing-search.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingStatus } from '@/types';

@Controller('listings')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('search')
  async search(
    @Query() searchDto: ListingSearchDto,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.listingsService.search(searchDto, paginationDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createListingDto: CreateListingDto,
    @CurrentUser() user: User,
  ) {
    return this.listingsService.create(createListingDto, user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
    @CurrentUser() user: User,
  ) {
    return this.listingsService.update(id, updateListingDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.listingsService.remove(id, user);
  }

  @Post(':id/close')
  async close(@Param('id') id: string, @CurrentUser() user: User) {
    return this.listingsService.updateStatus(id, ListingStatus.CLOSED, user);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @CurrentUser() user: User) {
    return this.listingsService.updateStatus(id, ListingStatus.COMPLETED, user);
  }
}



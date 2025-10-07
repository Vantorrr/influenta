import { Controller, Get, Post, Body, Query, Param, UseGuards, Put, Patch, Delete } from '@nestjs/common';
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
  async search(@Query() query: any) {
    const searchDto: ListingSearchDto = {
      search: query.search,
      status: query.status,
      minBudget: query.minBudget ? parseInt(String(query.minBudget), 10) : undefined,
      maxBudget: query.maxBudget ? parseInt(String(query.maxBudget), 10) : undefined,
      format: query.format,
    } as ListingSearchDto;
    const paginationDto: PaginationDto = {
      page: query.page ? parseInt(String(query.page), 10) : undefined,
      limit: query.limit ? parseInt(String(query.limit), 10) : undefined,
    } as PaginationDto;
    return this.listingsService.search(searchDto, paginationDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyListings(@CurrentUser() user: User, @Query() paginationDto: PaginationDto) {
    return this.listingsService.getMyListings(user, paginationDto);
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

  @Patch(':id')
  async patch(
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









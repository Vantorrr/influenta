import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';

@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  async create(@Body() createOfferDto: CreateOfferDto, @CurrentUser() user: User) {
    return this.offersService.create(createOfferDto, user);
  }

  @Get('my')
  async getMy(@CurrentUser() user: User) {
    if (user.role === 'blogger') {
      return this.offersService.findAllForBlogger(user);
    } else {
      return this.offersService.findAllForAdvertiser(user);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.offersService.findOne(id, user);
  }

  @Post(':id/respond')
  async respond(
    @Param('id') id: string,
    @Body() respondDto: RespondOfferDto,
    @CurrentUser() user: User,
  ) {
    return this.offersService.respond(id, respondDto, user);
  }
}

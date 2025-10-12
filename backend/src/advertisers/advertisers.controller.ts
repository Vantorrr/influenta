import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { AdvertisersService } from './advertisers.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';

@Controller('advertisers')
export class AdvertisersController {
  constructor(private readonly advertisersService: AdvertisersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return this.advertisersService.findOrCreateByUserId(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.advertisersService.findOne(id);
  }
}







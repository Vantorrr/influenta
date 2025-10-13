import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdvertisersService } from './advertisers.service';
import { AdvertisersController } from './advertisers.controller';
import { Advertiser } from './entities/advertiser.entity';
import { User } from '@/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Advertiser, User])],
  controllers: [AdvertisersController],
  providers: [AdvertisersService],
  exports: [AdvertisersService],
})
export class AdvertisersModule {}








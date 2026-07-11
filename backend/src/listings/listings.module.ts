import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing } from './entities/listing.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { User } from '@/users/entities/user.entity';
import { TelegramModule } from '@/telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Listing, Advertiser, User]),
    TelegramModule,
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}




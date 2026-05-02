import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersService } from './offers.service';
import { OffersController } from './offers.controller';
import { Offer } from './entities/offer.entity';
import { TelegramModule } from '@/telegram/telegram.module';
import { ChatModule } from '@/chat/chat.module';
import { BloggersModule } from '@/bloggers/bloggers.module';
import { AdvertisersModule } from '@/advertisers/advertisers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offer]),
    TelegramModule,
    ChatModule,
    BloggersModule,
    AdvertisersModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}

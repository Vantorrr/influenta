import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { TelegramController } from './telegram.controller';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/users/entities/user.entity';
import { Blogger } from '@/bloggers/entities/blogger.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { Response } from '@/responses/entities/response.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Blogger, Advertiser, Listing, Response]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}


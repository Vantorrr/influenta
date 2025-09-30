import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';
import { ResponsesController } from './responses.controller';
import { ListingsModule } from '@/listings/listings.module';
import { Blogger } from '@/bloggers/entities/blogger.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { TelegramModule } from '@/telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([Response, Blogger, Advertiser, Listing]), ListingsModule, TelegramModule],
  controllers: [ResponsesController],
  exports: [TypeOrmModule],
})
export class ResponsesModule {}






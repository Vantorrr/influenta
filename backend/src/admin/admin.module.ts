import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing } from '../listings/entities/listing.entity';
import { Response } from '../responses/entities/response.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Blogger, Advertiser, Listing, Response]),
    TelegramModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}


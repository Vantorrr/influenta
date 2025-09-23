import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { User } from '@/users/entities/user.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing } from '@/listings/entities/listing.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Advertiser, Listing])],
  controllers: [SeedController],
  providers: [SeedService],
})
export class SeedModule {}



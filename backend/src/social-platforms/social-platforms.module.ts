import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialPlatform } from './entities/social-platform.entity';
import { SocialPlatformsService } from './social-platforms.service';
import { SocialPlatformsController } from './social-platforms.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SocialPlatform])],
  controllers: [SocialPlatformsController],
  providers: [SocialPlatformsService],
  exports: [SocialPlatformsService],
})
export class SocialPlatformsModule {}





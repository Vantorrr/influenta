import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersController } from './bloggers.controller';
import { BloggersService } from './bloggers.service';
import { User } from '@/users/entities/user.entity';
import { Blogger } from './entities/blogger.entity';
import { SocialPlatform } from '@/social-platforms/entities/social-platform.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Blogger, SocialPlatform])],
  controllers: [BloggersController],
  providers: [BloggersService],
  exports: [BloggersService],
})
export class BloggersModule {}









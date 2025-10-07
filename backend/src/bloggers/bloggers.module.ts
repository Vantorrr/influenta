import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersController } from './bloggers.controller';
import { BloggersService } from './bloggers.service';
import { User } from '@/users/entities/user.entity';
import { Blogger } from './entities/blogger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Blogger])],
  controllers: [BloggersController],
  providers: [BloggersService],
  exports: [BloggersService],
})
export class BloggersModule {}





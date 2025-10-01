import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BloggersController } from './bloggers.controller';
import { BloggersService } from './bloggers.service';
import { User } from '@/users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [BloggersController],
  providers: [BloggersService],
  exports: [BloggersService],
})
export class BloggersModule {}





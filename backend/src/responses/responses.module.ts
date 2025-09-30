import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';
import { ResponsesController } from './responses.controller';
import { ListingsModule } from '@/listings/listings.module';

@Module({
  imports: [TypeOrmModule.forFeature([Response]), ListingsModule],
  controllers: [ResponsesController],
  exports: [TypeOrmModule],
})
export class ResponsesModule {}






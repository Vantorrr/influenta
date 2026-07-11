import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SafeDeal } from './entities/safe-deal.entity';
import { Offer } from '../offers/entities/offer.entity';
import { User } from '../users/entities/user.entity';
import { SafeDealsService } from './safe-deals.service';
import { TBankService } from './tbank.service';
import { SafeDealsController } from './safe-deals.controller';
import { PaymentsWebhookController } from './payments-webhook.controller';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SafeDeal, Offer, User]),
    TelegramModule,
  ],
  controllers: [SafeDealsController, PaymentsWebhookController],
  providers: [SafeDealsService, TBankService],
  exports: [SafeDealsService],
})
export class SafeDealsModule {}

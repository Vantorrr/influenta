import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { SafeDealsService } from './safe-deals.service';
import { DeliverDealDto, DisputeDealDto } from './dto/deal-action.dto';

@ApiTags('safe-deals')
@ApiBearerAuth()
@Controller('safe-deals')
@UseGuards(JwtAuthGuard)
export class SafeDealsController {
  constructor(
    private readonly safeDealsService: SafeDealsService,
    private readonly configService: ConfigService,
  ) {}

  private isAdmin(user: User): boolean {
    if (user?.role === 'admin') return true;
    const adminIds = this.configService.get<number[]>('app.admins.telegramIds') || [];
    return !!user?.telegramId && adminIds.includes(parseInt(String(user.telegramId), 10));
  }

  @Post('offer/:offerId')
  @ApiOperation({ summary: 'Создать безопасную сделку по офферу и получить ссылку на оплату' })
  createForOffer(@Param('offerId') offerId: string, @CurrentUser() user: User) {
    return this.safeDealsService.createForOffer(offerId, user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Список моих безопасных сделок' })
  listMy(@CurrentUser() user: User) {
    return this.safeDealsService.listForUser(user);
  }

  @Get('by-offer/:offerId')
  @ApiOperation({ summary: 'Сделка по офферу (или null)' })
  getByOffer(@Param('offerId') offerId: string, @CurrentUser() user: User) {
    return this.safeDealsService.getByOffer(offerId, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Детали сделки' })
  getOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.safeDealsService.getById(id, user, this.isAdmin(user));
  }

  @Post(':id/delivered')
  @ApiOperation({ summary: 'Блогер отметил работу выполненной' })
  markDelivered(@Param('id') id: string, @Body() dto: DeliverDealDto, @CurrentUser() user: User) {
    return this.safeDealsService.markDelivered(id, user, dto?.note);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Рекламодатель подтверждает выполнение (релиз средств)' })
  release(@Param('id') id: string, @CurrentUser() user: User) {
    return this.safeDealsService.release(id, user, this.isAdmin(user));
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Открыть спор по сделке' })
  dispute(@Param('id') id: string, @Body() dto: DisputeDealDto, @CurrentUser() user: User) {
    return this.safeDealsService.openDispute(id, user, dto?.reason);
  }

  @Post(':id/admin/release')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Админ: завершить сделку в пользу блогера' })
  adminRelease(@Param('id') id: string, @CurrentUser() user: User) {
    return this.safeDealsService.release(id, user, true);
  }

  @Post(':id/admin/refund')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Админ: вернуть средства рекламодателю' })
  adminRefund(@Param('id') id: string) {
    return this.safeDealsService.adminRefund(id);
  }
}

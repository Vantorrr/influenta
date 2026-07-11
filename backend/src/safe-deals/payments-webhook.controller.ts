import { Body, Controller, Post, HttpCode, Logger } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SafeDealsService } from './safe-deals.service';

/**
 * Публичный контроллер для приёма уведомлений (webhook) от T-Bank.
 * Не защищён JWT — подпись проверяется по Token внутри сервиса.
 */
@ApiExcludeController()
@Controller('payments/tbank')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(private readonly safeDealsService: SafeDealsService) {}

  @Post('webhook')
  @HttpCode(200)
  async webhook(@Body() body: Record<string, any>): Promise<string> {
    try {
      return await this.safeDealsService.handleNotification(body || {});
    } catch (err: any) {
      this.logger.error(`T-Bank webhook processing error: ${err?.message}`);
      // Возвращаем OK, чтобы банк не заваливал ретраями при внутренней ошибке
      return 'OK';
    }
  }
}

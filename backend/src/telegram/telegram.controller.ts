import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    message: {
      message_id: number;
      chat: {
        id: number;
      };
    };
    data: string;
  };
}

@ApiTags('Telegram')
@Controller('telegram')
export class TelegramController {
  private readonly adminIds: number[];

  constructor(
    private telegramService: TelegramService,
    private configService: ConfigService,
  ) {
    this.adminIds =
      this.configService.get<number[]>('app.admins.telegramIds') ?? [
        741582706,
        8141463258,
        8722632476,
      ];
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Telegram webhook handler' })
  async handleWebhook(@Body() update: TelegramUpdate) {
    try {
      if (update.message) {
        await this.handleMessage(update.message);
      }

      if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query);
      }

      return { ok: true };
    } catch (error) {
      console.error('Webhook error:', error);
      return { ok: false, error: error.message };
    }
  }

  @Get('set-webhook')
  @ApiOperation({ summary: 'Set Telegram webhook' })
  async setWebhook(@Query('url') webhookUrl?: string) {
    const baseUrl = process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN || 'https://web-production-2bad2.up.railway.app';
    const url = webhookUrl || `${baseUrl}/telegram/webhook`;
    
    const result = await this.telegramService.setWebhook(url);
    return result;
  }

  private async handleMessage(message: any) {
    const chatId = message.chat.id;
    const text = message.text;
    const userId = message.from.id;
    const firstName = message.from.first_name;
    const isAdmin = this.adminIds.includes(userId);

    if (text === '/start') {
      const welcomeMessage = this.telegramService.getWelcomeMessage(firstName, isAdmin);
      const keyboard = this.telegramService.getInlineKeyboard(isAdmin);

      await this.telegramService.sendMessage(chatId, welcomeMessage, keyboard);
    } else if (text === '/help') {
      const helpMessage = this.telegramService.getHelpMessage();
      await this.telegramService.sendMessage(chatId, helpMessage);
    } else if (text === '/admin' && isAdmin) {
      const adminMessage = `👑 <b>Админ Панель</b>

Добро пожаловать в панель администратора!

🛠 <b>Доступные функции:</b>
• Управление пользователями
• Модерация контента  
• Статистика платформы
• Настройки системы

👆 Нажмите кнопку ниже для входа в админ панель:`;

      const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app'
      const adminKeyboard = {
        inline_keyboard: [
          [{ text: '🛠 Открыть Админ Панель', web_app: { url: `${frontendUrl}/admin/dashboard` } }]
        ]
      };

      await this.telegramService.sendMessage(chatId, adminMessage, adminKeyboard);
    } else {
      // Отвечаем на любое сообщение приглашением использовать мини-апп
      const responseMessage = `👋 Привет! 

Для работы с платформой используйте мини-приложение.

👆 Нажмите кнопку "🚀 Открыть Influenta" ниже!`;

      const keyboard = this.telegramService.getInlineKeyboard(isAdmin);
      await this.telegramService.sendMessage(chatId, responseMessage, keyboard);
    }
  }

  private async handleCallbackQuery(callbackQuery: any) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const userId = callbackQuery.from.id;
    const isAdmin = this.adminIds.includes(userId);

    if (data === 'stats') {
      const statsMessage = await this.telegramService.getStatsMessage();
      await this.telegramService.sendMessage(chatId, statsMessage);
    } else if (data === 'help') {
      const helpMessage = this.telegramService.getHelpMessage();
      await this.telegramService.sendMessage(chatId, helpMessage);
    }
  }
}








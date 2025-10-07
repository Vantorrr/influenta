import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Blogger } from '@/bloggers/entities/blogger.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { Response as ListingResponse } from '@/responses/entities/response.entity';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly botApiUrl: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Blogger) private readonly bloggersRepo: Repository<Blogger>,
    @InjectRepository(Advertiser) private readonly advertisersRepo: Repository<Advertiser>,
    @InjectRepository(Listing) private readonly listingsRepo: Repository<Listing>,
    @InjectRepository(ListingResponse) private readonly responsesRepo: Repository<ListingResponse>,
  ) {
    this.botToken = this.configService.get('app.telegram.botToken') || process.env.TELEGRAM_BOT_TOKEN || '';
    this.botApiUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId: number, text: string, replyMarkup?: any) {
    const url = `${this.botApiUrl}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: replyMarkup,
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async getUserInfo(userId: number): Promise<{ username?: string; first_name?: string; last_name?: string } | null> {
    try {
      const url = `${this.botApiUrl}/getChat`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: userId }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      if (!data?.ok || !data?.result) return null;
      return {
        username: data.result.username,
        first_name: data.result.first_name,
        last_name: data.result.last_name,
      };
    } catch {
      return null;
    }
  }

  async setWebhook(webhookUrl: string) {
    const url = `${this.botApiUrl}/setWebhook`;
    
    const payload = {
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      return await response.json();
    } catch (error) {
      console.error('Error setting webhook:', error);
      throw error;
    }
  }

  getWelcomeMessage(firstName: string, isAdmin: boolean = false) {
    const adminBadge = isAdmin ? '👑 <b>АДМИНИСТРАТОР</b>\n\n' : '';
    
    return `${adminBadge}🚀 <b>Добро пожаловать в Influenta, ${firstName}!</b>

💡 <b>Influenta</b> — это платформа для взаимодействия блогеров и рекламодателей в Telegram.

🔥 <b>Что вы можете делать:</b>
${isAdmin ? '• 🛠 Управлять платформой (админ панель)\n' : ''}• 📱 Создать профиль блогера или рекламодателя
• 🎯 Найти подходящих партнеров
• 💬 Общаться в встроенном чате
• 📊 Отслеживать статистику

👆 <b>Нажмите кнопку "🚀 Открыть Influenta" ниже, чтобы начать!</b>`;
  }

  getInlineKeyboard(isAdmin: boolean = false) {
    const keyboard = [];
    const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app'

    if (isAdmin) {
      keyboard.push([
        { text: '🛠 Админ Панель', web_app: { url: `${frontendUrl}/admin/dashboard` } }
      ]);
    }

    keyboard.push([
      { text: '🚀 Открыть Influenta', web_app: { url: `${frontendUrl}` } }
    ]);

    keyboard.push([
      { text: '📊 Статистика', callback_data: 'stats' },
      { text: '❓ Помощь', callback_data: 'help' }
    ]);

    return {
      inline_keyboard: keyboard
    };
  }

  getHelpMessage() {
    return `❓ <b>Помощь по Influenta</b>

<b>🎯 Для блогеров:</b>
1. Создайте профиль с указанием тематики
2. Установите цены на размещение
3. Получайте заявки от рекламодателей
4. Выбирайте интересные предложения

<b>💼 Для рекламодателей:</b>
1. Опубликуйте рекламное предложение
2. Укажите бюджет и требования
3. Получайте отклики от блогеров
4. Выбирайте подходящих исполнителей

<b>📞 Поддержка:</b>
По всем вопросам обращайтесь к администраторам.`;
  }

  async getStatsMessage() {
    // Собираем реальные данные
    const [totalUsers, totalBloggers, totalAdvertisers, activeListings, totalResponses] = await Promise.all([
      this.usersRepo.count().catch(() => 0),
      this.bloggersRepo.count().catch(() => 0),
      this.advertisersRepo.count().catch(() => 0),
      this.listingsRepo.count({ where: { status: 'active' as any } }).catch(() => 0),
      this.responsesRepo.count().catch(() => 0),
    ]);

    const activeUsersEstimate = Math.max(totalUsers - Math.floor(totalUsers * 0.15), 0); // грубая оценка 85%

    return `📊 <b>Статистика Influenta</b>

👥 <b>Пользователи:</b>
• Всего: ${totalUsers.toLocaleString('ru-RU')}
• Блогеров: ${totalBloggers.toLocaleString('ru-RU')}
• Рекламодателей: ${totalAdvertisers.toLocaleString('ru-RU')}
• Активных: ~${activeUsersEstimate.toLocaleString('ru-RU')}

📈 <b>Активность:</b>
• Активных объявлений: ${activeListings.toLocaleString('ru-RU')}
• Всего откликов: ${totalResponses.toLocaleString('ru-RU')}

🚀 <b>Присоединяйтесь к растущему сообществу!</b>`;
  }

  async sendMessageWithButton(chatId: string | number, text: string, buttonText: string, appPath: string) {
    try {
      const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'influentaa_bot';
      const webAppUrl = `https://t.me/${botUsername}/app?startapp=${appPath.replace(/\//g, '-')}`;
      
      console.log('📨 sendMessageWithButton called with:', {
        chatId,
        buttonText,
        webAppUrl,
        textLength: text.length
      });
      
      const url = `${this.botApiUrl}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [[
            {
              text: buttonText,
              url: webAppUrl
            }
          ]]
        }
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!result.ok) {
        console.error('❌ Telegram API error:', result);
        throw new Error(result.description || 'Failed to send message');
      }
      
      console.log('✅ Message sent successfully:', result.result.message_id);
      return result;
    } catch (error) {
      console.error('❌ Error sending message with button:', error);
      throw error;
    }
  }
}





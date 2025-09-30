import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly botApiUrl: string;

  constructor(private configService: ConfigService) {
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

  getStatsMessage() {
    return `📊 <b>Статистика Influenta</b>

👥 <b>Пользователи:</b>
• Блогеров: 10,000+
• Рекламодателей: 500+
• Активных пользователей: 8,500+

📈 <b>Активность:</b>
• Объявлений за месяц: 1,200+
• Успешных сделок: 850+
• Довольных клиентов: 95%

🚀 <b>Присоединяйтесь к растущему сообществу!</b>`;
  }
}




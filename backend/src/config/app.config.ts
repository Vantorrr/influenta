import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Telegram Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webAppUrl: process.env.TELEGRAM_WEBAPP_URL,
  },
  
  // Admin Configuration
  admins: {
    telegramIds: [
      741582706,   // Admin 1
      8141463258,  // Admin 2
    ],
    emails: [
      'admin@example.com',
    ],
  },
  
  // Platform Configuration
  platform: {
    name: 'Influencer Platform',
    commission: 10, // 10% commission
    minWithdrawal: 1000, // минимальная сумма вывода
  },
}))


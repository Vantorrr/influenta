import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Telegram Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webAppUrl: process.env.TELEGRAM_WEBAPP_URL || 'https://influentaa.vercel.app',
  },
  
  // Admin Configuration
  admins: {
    telegramIds: [
      741582706,   // Admin 1
      8141463258,  // Admin 2
      8722632476,  // Admin 3
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

  // Публичный URL бэкенда (для NotificationURL платёжного шлюза)
  backendUrl:
    process.env.BACKEND_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'https://web-production-2bad2.up.railway.app'),

  // Payments (T-Bank / Tinkoff Internet Acquiring + E2C payouts)
  payments: {
    tbank: {
      terminalKey: process.env.TBANK_TERMINAL_KEY || '1783341874843DEMO',
      password: process.env.TBANK_PASSWORD || '9$HKgGnJY$RNC!O5',
      apiUrl: process.env.TBANK_API_URL || 'https://securepay.tinkoff.ru/v2',
      // Отправлять ли онлайн-чек (54-ФЗ). Для тестового терминала обычно не требуется.
      sendReceipt: process.env.TBANK_SEND_RECEIPT === 'true',
      receiptEmail: process.env.TBANK_RECEIPT_EMAIL || 'receipts@influenta.app',
      taxation: process.env.TBANK_TAXATION || 'usn_income',
      vat: process.env.TBANK_VAT || 'none',
      // Выплатной терминал (E2C / СБП → блогер)
      payoutTerminalKey: process.env.TBANK_PAYOUT_TERMINAL_KEY || '',
      payoutPassword: process.env.TBANK_PAYOUT_PASSWORD || '',
      e2cApiUrl: process.env.TBANK_E2C_API_URL || 'https://securepay.tinkoff.ru/e2c/v2',
      // Если Railway вне РФ и T-Bank режет IP — HTTP(S) прокси в РФ
      proxyUrl: process.env.TBANK_HTTPS_PROXY || process.env.HTTPS_PROXY || '',
    },
  },
}))










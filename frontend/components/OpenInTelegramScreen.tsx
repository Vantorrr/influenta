'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Send } from 'lucide-react'

const BOT_URL = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/influenta_bot'
const SUPPORT_URL = 'https://t.me/influenta_support_bot'

/**
 * Отображается, когда мини-приложение открыли вне Telegram (обычный браузер).
 * Раньше код в этом случае подсовывал «dev-user», из-за чего любые API-запросы
 * валились на 401 и пользователь попадал в петлю редиректов.
 */
export function OpenInTelegramScreen() {
  return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center mb-6">
          <Send className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-2xl font-bold mb-3 text-telegram-text">
          Откройте в Telegram
        </h1>
        <p className="text-telegram-textSecondary mb-8 leading-relaxed">
          Influenta работает как мини-приложение Telegram — авторизация
          происходит автоматически через вашу учётную запись Telegram.
          Откройте бота и нажмите «Запустить».
        </p>

        <a
          href={BOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full bg-telegram-primary hover:bg-telegram-primary/90 text-white font-semibold py-3.5 rounded-xl transition-colors"
        >
          <Send className="w-4 h-4" />
          Открыть бота в Telegram
        </a>

        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 w-full text-telegram-textSecondary hover:text-telegram-primary transition-colors text-sm"
        >
          <ExternalLink className="w-4 h-4" />
          Не работает? Напишите в поддержку
        </a>
      </motion.div>
    </div>
  )
}

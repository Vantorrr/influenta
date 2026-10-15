'use client'

import Link from 'next/link'
import { Headphones, MessageCircle, Shield, Pin, ArrowLeft } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const SUPPORT_BOT = 'https://t.me/influenta_support_bot'

function openSupport() {
  const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(SUPPORT_BOT)
  } else if (tg?.openLink) {
    tg.openLink(SUPPORT_BOT)
  } else {
    window.open(SUPPORT_BOT, '_blank')
  }
}

export default function SupportPage() {
  return (
    <Layout>
      <div className="container py-6 space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-lg bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Поддержка</h1>
        </div>

        <Card className="bg-[#1C1E20] border-white/5">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-telegram-primary/15 flex items-center justify-center">
                <Headphones className="w-6 h-6 text-telegram-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Служба поддержки Influenta</h2>
                <p className="text-sm text-white/50">Отвечаем в Telegram, обычно в течение дня</p>
              </div>
            </div>

            <Button
              variant="primary"
              fullWidth
              onClick={openSupport}
              className="h-12"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Написать в поддержку
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/50 uppercase tracking-wider px-1">
            С чем можем помочь
          </h3>
          <Card className="bg-[#1C1E20] border-white/5">
            <CardContent className="p-4 flex gap-3">
              <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Безопасная сделка и крипто-оплата</p>
                <p className="text-sm text-white/50 mt-1">
                  Подтверждение поступления USDT, споры, возвраты — обрабатываем вручную.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1C1E20] border-white/5">
            <CardContent className="p-4 flex gap-3">
              <Pin className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Закреп объявления</p>
                <p className="text-sm text-white/50 mt-1">
                  Отдельная платная услуга. Напишите нам после запроса закрепа при создании объявления.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

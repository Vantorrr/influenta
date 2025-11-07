'use client'

import { Layout } from '@/components/layout/navigation'
import { Shield, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  return (
    <Layout>
      <div className="container py-6 space-y-6">
        {/* Support CTA */}
        <div className="bg-gradient-to-br from-telegram-primary/15 via-telegram-accent/10 to-telegram-primary/15 border border-telegram-border rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-telegram-primary to-telegram-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">Нужна помощь?</h2>
              <p className="text-telegram-textSecondary mb-4">
                Напишите в Telegram — Полина поможет оперативно.
              </p>
              <a
                href="https://t.me/polina_khristya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-telegram-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-telegram-primary/90 transition-colors"
              >
                Связаться с поддержкой
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

 
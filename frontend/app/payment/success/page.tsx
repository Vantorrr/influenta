'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { safeDealApi, SafeDeal } from '@/lib/api'

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')
  const [deal, setDeal] = useState<SafeDeal | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let attempts = 0
    let timer: any

    const poll = async () => {
      if (!dealId) {
        setLoading(false)
        return
      }
      try {
        const d = await safeDealApi.getById(dealId)
        setDeal(d)
        // Ждём подтверждения оплаты по webhook (funded), максимум ~10 сек
        if (d.status !== 'funded' && d.status !== 'released' && attempts < 5) {
          attempts += 1
          timer = setTimeout(poll, 2000)
          return
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }

    poll()
    return () => timer && clearTimeout(timer)
  }, [dealId])

  const goToDeal = () => {
    if (deal?.offerId) router.push(`/offers/${deal.offerId}`)
    else router.push('/offers')
  }

  return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {loading ? (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-telegram-primary animate-spin" />
              <h1 className="text-xl font-bold mb-2">Проверяем оплату…</h1>
              <p className="text-telegram-textSecondary text-sm">Это займёт пару секунд.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <h1 className="text-xl font-bold mb-2">Оплата прошла успешно</h1>
              <p className="text-telegram-textSecondary text-sm mb-4">
                {deal?.status === 'funded'
                  ? 'Средства зарезервированы на защищённом счёте. Деньги поступят блогеру после подтверждения выполнения работы.'
                  : 'Платёж обрабатывается. Статус сделки обновится автоматически в течение минуты.'}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-telegram-textSecondary mb-6">
                <ShieldCheck className="w-4 h-4 text-telegram-primary" />
                Защищено безопасной сделкой T-Bank
              </div>
              <Button variant="primary" fullWidth onClick={goToDeal}>
                Вернуться к сделке
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-telegram-primary animate-spin" />
          </div>
        }
      >
        <PaymentSuccessContent />
      </Suspense>
    </Layout>
  )
}

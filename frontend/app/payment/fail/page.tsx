'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, Loader2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function PaymentFailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dealId = searchParams.get('dealId')

  const goBack = () => {
    router.push('/offers')
  }

  return (
    <div className="min-h-screen bg-telegram-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Оплата не прошла</h1>
          <p className="text-telegram-textSecondary text-sm mb-6">
            Платёж не был завершён. Средства не списаны — вы можете попробовать оплатить сделку ещё раз.
          </p>
          <Button variant="primary" fullWidth onClick={goBack}>
            Вернуться к предложениям
          </Button>
          {dealId && (
            <p className="text-xs text-telegram-textSecondary mt-3">Сделка №{dealId.slice(0, 8)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentFailPage() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-telegram-primary animate-spin" />
          </div>
        }
      >
        <PaymentFailContent />
      </Suspense>
    </Layout>
  )
}

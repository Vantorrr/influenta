'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { safeDealApi } from '@/lib/api'

export default function SafeDealRedirectPage() {
  const params = useParams() as { id: string }
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const deal = await safeDealApi.getById(params.id)
        if (cancelled) return
        if (deal?.offerId) router.replace(`/offers/${deal.offerId}`)
        else router.replace('/offers')
      } catch {
        if (!cancelled) router.replace('/offers')
      }
    }
    if (params?.id) run()
    return () => {
      cancelled = true
    }
  }, [params?.id, router])

  return (
    <Layout>
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-telegram-primary animate-spin" />
      </div>
    </Layout>
  )
}

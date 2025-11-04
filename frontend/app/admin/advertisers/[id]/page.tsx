'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Globe, Shield, ArrowLeft, FileText, RubIcon } from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'
import { advertisersApi } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'

export default function AdminAdvertiserDetailsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!params?.id) return
    ;(async () => {
      try {
        const res = await advertisersApi.getById(params.id!)
        setData((res as any)?.data || res)
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Не удалось загрузить рекламодателя')
      } finally {
        setLoading(false)
      }
    })()
  }, [params?.id])

  if (loading) {
    return (
      <Layout>
        <div className="container py-6 text-telegram-textSecondary">Загрузка…</div>
      </Layout>
    )
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="container py-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <Card>
            <CardContent className="p-6 text-center text-telegram-textSecondary">{String(error || 'Не найдено')}</CardContent>
          </Card>
        </div>
      </Layout>
    )
  }

  const advertiser = data

  return (
    <Layout>
      <div className="container py-6 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-telegram-primary/20 rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-telegram-primary" />
              </div>
              <span className="truncate">{advertiser.companyName || '—'}</span>
              {advertiser.isVerified && <Badge variant="primary">Проверенный</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-telegram-textSecondary">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <a href={advertiser.website} target="_blank" rel="noreferrer" className="text-telegram-primary hover:underline">
                  {advertiser.website || '—'}
                </a>
              </div>
              <p className="mt-1">Email: {advertiser.email || '—'}</p>
              <p>Создан: {formatDate(advertiser.createdAt)}</p>
              <p>Активность: {formatDate(advertiser.lastActivity)}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-telegram-bg rounded-lg p-3">
                <p className="text-xs text-telegram-textSecondary mb-1">Активные объявления</p>
                <p className="font-semibold">{advertiser.activeListings || 0}</p>
              </div>
              <div className="bg-telegram-bg rounded-lg p-3">
                <p className="text-xs text-telegram-textSecondary mb-1">Потрачено</p>
                <p className="font-semibold">{formatPrice(advertiser.totalSpent || 0)}</p>
              </div>
              <div className="bg-telegram-bg rounded-lg p-3">
                <p className="text-xs text-telegram-textSecondary mb-1">Кампаний</p>
                <p className="font-semibold">{advertiser.completedCampaigns || 0}</p>
              </div>
              <div className="bg-telegram-bg rounded-lg p-3">
                <p className="text-xs text-telegram-textSecondary mb-1">Рейтинг</p>
                <p className="font-semibold">⭐ {advertiser.rating ?? 0}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {advertiser.userId && (
                <Button variant="secondary" onClick={() => {
                  window.open(`https://t.me/${advertiser?.user?.username || ''}`, '_blank')
                }}>
                  Связаться в Telegram
                </Button>
              )}
              <Button variant="secondary" onClick={() => { window.location.href = '/admin/listings' }}>
                <FileText className="w-4 h-4 mr-2" /> Объявления
              </Button>
              <Button variant="secondary" onClick={() => { window.location.href = '/admin/dashboard' }}>
                <RubIcon className="w-4 h-4 mr-2" /> Дашборд
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}












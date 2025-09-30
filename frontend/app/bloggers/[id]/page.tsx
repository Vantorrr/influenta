'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Eye, Star, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { bloggersApi } from '@/lib/api'
import { formatNumber } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function BloggerDetailsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !params?.id) return
    ;(async () => {
      try {
        const resp = await bloggersApi.getById(params.id!)
        setData(resp.data || resp)
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Ошибка загрузки')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [user, params?.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
          <p className="text-telegram-textSecondary">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-telegram-bg p-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <Card>
          <CardContent className="p-6 text-center text-telegram-textSecondary">
            {String(error || 'Профиль не найден')}
          </CardContent>
        </Card>
      </div>
    )
  }

  const blogger = data

  return (
    <div className="min-h-screen bg-telegram-bg p-4 space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar
              src={blogger.user?.photoUrl}
              firstName={blogger.user?.firstName || ''}
              lastName={blogger.user?.lastName || ''}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold truncate">
                  {blogger.user?.firstName} {blogger.user?.lastName}
                </span>
                {blogger.isVerified && <Shield className="w-4 h-4 text-telegram-primary" />}
              </div>
              <p className="text-sm text-telegram-textSecondary truncate">{blogger.user?.username}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(blogger.categories || []).map((c: string) => (
              <Badge key={c} variant="default">{c}</Badge>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-telegram-textSecondary">Подписчики</p>
              <p className="font-medium flex items-center gap-1"><Users className="w-4 h-4" />{formatNumber(blogger.subscribersCount || 0)}</p>
            </div>
            <div>
              <p className="text-telegram-textSecondary">Ср. просмотры</p>
              <p className="font-medium flex items-center gap-1"><Eye className="w-4 h-4" />{formatNumber(blogger.averageViews || 0)}</p>
            </div>
            <div>
              <p className="text-telegram-textSecondary">Рейтинг</p>
              <p className="font-medium flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500" />{blogger.rating || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



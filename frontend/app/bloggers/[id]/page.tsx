'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Eye, Star, Shield, Ban, CheckCircle, Trash2, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { bloggersApi, socialPlatformsApi } from '@/lib/api'
import { formatNumber, getCategoryLabel } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { OfferModal } from '@/components/OfferModal'
import { PlatformsList } from '@/components/profile/PlatformsList'
import { useQuery } from '@tanstack/react-query'

export default function BloggerDetailsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Загружаем платформы блогера
  const { data: platforms = [] } = useQuery({
    queryKey: ['blogger-platforms', params?.id],
    queryFn: () => socialPlatformsApi.getUserPlatforms(params.id!),
    enabled: !!params?.id && !!data?.user?.id,
  })

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
  const isOwner = !!user && (user.id === (blogger.user?.id || blogger.id))

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
              <p className="text-sm text-telegram-textSecondary truncate">
                {blogger.categories && blogger.categories.length > 0 
                  ? blogger.categories.slice(0, 2).join(', ')
                  : 'Контакты скрыты до сотрудничества'}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Admin-only actions */}
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant={blogger.isVerified ? 'secondary' : 'primary'}
                size="sm"
                onClick={async () => {
                  const url = blogger.isVerified
                    ? `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}/unverify`
                    : `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}/verify`
                  await fetch(url, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } })
                  router.refresh()
                }}
              >
                {blogger.isVerified ? (<><Shield className="w-4 h-4 mr-1" /> Снять верификацию</>) : (<><CheckCircle className="w-4 h-4 mr-1" /> Верифицировать</>)}
              </Button>
              <Button
                variant={blogger.user?.isActive === false ? 'success' : 'danger'}
                size="sm"
                onClick={async () => {
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}/block`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } })
                  router.refresh()
                }}
              >
                <Ban className="w-4 h-4 mr-1" /> {blogger.user?.isActive === false ? 'Разблокировать' : 'Заблокировать'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (!confirm('Удалить пользователя (деактивация)?')) return
                  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } })
                  router.back()
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Удалить
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {(blogger.categories || []).map((c: string) => (
              <Badge key={c} variant="default">{getCategoryLabel(c)}</Badge>
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

          {/* Кнопка для рекламодателей */}
          {user?.role === 'advertiser' && (
            <div className="mt-6 space-y-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setShowOfferModal(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Предложить сотрудничество
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно для отправки предложения */}
      {showOfferModal && (
        <OfferModal
          bloggerId={params.id}
          bloggerName={`${blogger.user?.firstName || ''} ${blogger.user?.lastName || ''}`.trim()}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            setShowOfferModal(false)
            alert('Предложение отправлено! Блогер получит уведомление в Telegram.')
          }}
        />
      )}
    </div>
  )
}









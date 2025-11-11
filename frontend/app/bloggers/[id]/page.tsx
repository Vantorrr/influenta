'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Eye, Shield, Ban, CheckCircle, Trash2, MessageSquare } from 'lucide-react'
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
  const [showUnverifyModal, setShowUnverifyModal] = useState(false)
  const [showUnverifyInline, setShowUnverifyInline] = useState(false)
  const [unverifyReason, setUnverifyReason] = useState('')

  // ID пользователя для загрузки платформ (после загрузки профиля)
  const userIdForPlatforms = (data?.user?.id || data?.id) as string | undefined

  const loadBlogger = async (id: string) => {
    try {
      const resp = await bloggersApi.getById(id)
      setData(resp.data || resp)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Ошибка загрузки')
    } finally {
      setIsLoading(false)
    }
  }

  // Загружаем платформы блогера (по userId)
  const { data: platforms = [] } = useQuery({
    queryKey: ['blogger-platforms', userIdForPlatforms],
    queryFn: () => socialPlatformsApi.getUserPlatforms(userIdForPlatforms!),
    enabled: !!userIdForPlatforms,
  })

  useEffect(() => {
    if (!user || !params?.id) return
    ;(async () => { await loadBlogger(params.id!) })()
  }, [user, params?.id])

  // Фолбэк: автообновление при возврате/фокусе мини‑приложения
  useEffect(() => {
    const onFocus = () => { if (params?.id) loadBlogger(params.id) }
    const onVisibility = () => { if (typeof document !== 'undefined' && !document.hidden && params?.id) loadBlogger(params.id) }
    try { window.addEventListener('focus', onFocus) } catch {}
    try { document.addEventListener('visibilitychange', onVisibility) } catch {}
    return () => {
      try { window.removeEventListener('focus', onFocus) } catch {}
      try { document.removeEventListener('visibilitychange', onVisibility) } catch {}
    }
  }, [params?.id])

  // Короткий поллинг после действий админа: если еще не верифицировано, попробуем подтянуть изменения
  useEffect(() => {
    if (!params?.id) return
    if (!data || data.isVerified) return
    let tick = 0
    const interval = setInterval(() => {
      tick += 1
      loadBlogger(params.id!)
      if (tick >= 5 || (data && data.isVerified)) {
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [params?.id, data?.isVerified])

  useEffect(() => {
    const handler = (e: any) => {
      const verifiedUserId = e?.detail?.userId
      const currentTargetUserId = (data?.user?.id || data?.userId || data?.id) as string | undefined
      if (!verifiedUserId || !currentTargetUserId) return
      if (verifiedUserId === currentTargetUserId) {
        setIsLoading(true)
        if (params?.id) loadBlogger(params.id)
      }
    }
    window.addEventListener('user-verified' as any, handler as any)
    return () => {
      window.removeEventListener('user-verified' as any, handler as any)
    }
  }, [params?.id, data?.user?.id, data?.userId, data?.id])

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
          <CardContent className="p-6 text-center">
            <p className="text-lg mb-2">😔</p>
            <p className="text-telegram-textSecondary">
              Профиль блогера не найден или недоступен
            </p>
            <Button variant="primary" className="mt-4" onClick={() => router.push('/bloggers')}>
              К списку блогеров
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const blogger = data
  const targetUserId = blogger.user?.id || blogger.userId || blogger.id
  const isOwner = !!user && (user.id === targetUserId)

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
                  try {
                    const uid = targetUserId
                    if (blogger.isVerified) {
                      setUnverifyReason('')
                      // Покажем инлайн-поле прямо на странице (надежно для Mini App)
                      setShowUnverifyInline(true)
                      // И параллельно попытаемся открыть модалку (если окружение позволяет)
                      try { setShowUnverifyModal(true) } catch {}
                    } else {
                      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${uid}/verify`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` },
                      })
                      if (!resp.ok) {
                        const text = await resp.text()
                        alert(`Ошибка: ${resp.status} ${text}`)
                        return
                      }
                      // Оптимистичное обновление UI
                      setData(prev => prev ? { ...prev, isVerified: true } : prev)
                      try { (window as any).Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success') } catch {}
                      try { window.dispatchEvent(new CustomEvent('user-verified', { detail: { userId: uid } })) } catch {}
                      try { router.refresh() } catch {}
                    }
                  } catch (e: any) {
                    alert(`Ошибка: ${e?.message || e}`)
                  }
                }}
              >
                {blogger.isVerified ? (<><Shield className="w-4 h-4 mr-1" /> Снять верификацию</>) : (<><CheckCircle className="w-4 h-4 mr-1" /> Верифицировать</>)}
              </Button>
              <Button
                variant={blogger.user?.isActive === false ? 'primary' : 'danger'}
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
        {isAdmin && showUnverifyInline && (
          <div className="mt-3 p-3 border border-telegram-border rounded-lg bg-telegram-bg/60">
            <p className="text-sm text-telegram-textSecondary mb-2">Укажите причину снятия верификации:</p>
            <input
              value={unverifyReason}
              onChange={(e) => setUnverifyReason(e.target.value)}
              placeholder="Причина"
              className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text mb-2"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => { setShowUnverifyInline(false); setShowUnverifyModal(false) }}>Отмена</Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const uid = targetUserId
                  const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${uid}/unverify`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: unverifyReason || 'Без указания причины' })
                  })
                  if (!resp.ok) {
                    const text = await resp.text(); alert(`Ошибка: ${resp.status} ${text}`)
                    return
                  }
                  setShowUnverifyInline(false)
                  setShowUnverifyModal(false)
                  router.refresh()
                }}
              >Снять</Button>
            </div>
          </div>
        )}
          <div className="flex flex-wrap gap-2">
            {(blogger.categories || []).map((c: string) => (
              <Badge key={c} variant="default">{getCategoryLabel(c)}</Badge>
            ))}
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

      {/* Социальные сети блогера */}
      {platforms && platforms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Социальные сети</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformsList 
              platforms={platforms as any}
              isAdmin={isAdmin}
              telegramUsername={blogger.user?.username || blogger.user?.telegramUsername}
            />
          </CardContent>
        </Card>
      )}

  {/* Modal: причина снятия верификации */}
  {showUnverifyModal && (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowUnverifyModal(false)}>
      <div className="bg-telegram-bgSecondary rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3">Снять верификацию</h3>
        <p className="text-sm text-telegram-textSecondary mb-3">Укажите причину. Сообщение получит блогер в Telegram.</p>
        <input
          value={unverifyReason}
          onChange={(e) => setUnverifyReason(e.target.value)}
          placeholder="Причина снятия"
          className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text mb-4"
        />
        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setShowUnverifyModal(false)}>Отмена</Button>
          <Button
            variant="primary"
            fullWidth
            onClick={async () => {
              const uid = targetUserId
              const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${uid}/unverify`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: unverifyReason || 'Без указания причины' })
              })
              if (!resp.ok) {
                const text = await resp.text(); alert(`Ошибка: ${resp.status} ${text}`)
                return
              }
              setShowUnverifyModal(false)
              router.refresh()
            }}
          >Снять</Button>
        </div>
      </div>
    </div>
  )}

      {/* Модальное окно для отправки предложения */}
      {showOfferModal && (
        <OfferModal
          bloggerId={String(params.id || targetUserId)}
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














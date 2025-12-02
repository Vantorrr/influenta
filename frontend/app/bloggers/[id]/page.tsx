'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Eye, Shield, Ban, CheckCircle, Trash2, MessageSquare, Send, TrendingUp, Lock, Unlock, Edit, FileText, Star, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { bloggersApi, socialPlatformsApi, analyticsApi, adminApi, favoritesApi } from '@/lib/api'
import { formatNumber, getCategoryLabel, formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { OfferModal } from '@/components/OfferModal'
import { PlatformsList } from '@/components/profile/PlatformsList'
import { VerificationTooltip } from '@/components/VerificationTooltip'
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
  
  // Admin features state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [noteText, setNoteText] = useState('')
  
  // Favorites state
  const [isFavorite, setIsFavorite] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

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
    ;(async () => { 
      await loadBlogger(params.id!)
      // Проверяем, в избранном ли блогер
      try {
        const res = await favoritesApi.check(params.id!)
        setIsFavorite(res.isFavorite)
      } catch {}
    })()
  }, [user, params?.id])

  // Переключение избранного
  const toggleFavorite = async () => {
    if (!params?.id || favoriteLoading) return
    
    setFavoriteLoading(true)
    const wasFavorite = isFavorite
    setIsFavorite(!wasFavorite) // Оптимистичный UI
    
    try {
      await favoritesApi.toggle(params.id)
      // Haptic feedback
      try { (window as any).Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light') } catch {}
    } catch (e) {
      setIsFavorite(wasFavorite) // Откат при ошибке
    } finally {
      setFavoriteLoading(false)
    }
  }

  // Трекинг просмотра профиля другим пользователем
  useEffect(() => {
    if (!user || !data) return
    const targetUserId = (data?.user?.id || data?.userId || data?.id) as string | undefined
    if (!targetUserId) return
    if (user.id === targetUserId) return
    try {
      analyticsApi.track('profile_view', { targetUserId })
    } catch {}
  }, [user?.id, data?.user?.id, data?.userId, data?.id])

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

  // Короткий поллинг после действий админа
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
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-telegram-primary mb-4 hover:opacity-80 transition-opacity"
        >
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

  return (
    <div className="min-h-screen bg-telegram-bg pb-20">
      {/* Header Image / Pattern */}
      <div className="h-32 bg-gradient-to-br from-telegram-primary/20 via-blue-900/20 to-telegram-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-telegram-bg to-transparent" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="bg-black/20 backdrop-blur-md text-white hover:bg-black/30 border border-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </div>
        
        {/* Favorite Button */}
        {user && data && user.id !== (data.user?.id || data.userId || data.id) && (
          <button
            onClick={toggleFavorite}
            disabled={favoriteLoading}
            className={`absolute top-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isFavorite 
                ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40' 
                : 'bg-black/30 backdrop-blur-md text-white/80 hover:text-white border border-white/10'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <Heart className={`w-6 h-6 transition-all ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
      </div>

      <div className="container px-4 -mt-12 relative z-10 space-y-6">
        {/* Main Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-white/5 bg-[#1C1E20]/95 backdrop-blur shadow-xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex gap-5 items-start">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <Avatar
                    src={blogger.user?.photoUrl}
                    firstName={blogger.user?.firstName || ''}
                    lastName={blogger.user?.lastName || ''}
                    className="w-20 h-20 md:w-32 md:h-32 border-4 border-[#1C1E20] ring-4 ring-white/5 shadow-2xl"
                  />
                  {blogger.isVerified && (
                    <div className="absolute -bottom-1 -right-1 z-10">
                      <VerificationTooltip className="scale-90 md:scale-110" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pt-1 space-y-2.5">
                  <div>
                    <h1 className="text-xl md:text-3xl font-bold text-white truncate leading-tight">
                      {blogger.user?.firstName} {blogger.user?.lastName}
                    </h1>
                    {isAdmin && (
                      <a 
                        href={`https://t.me/${blogger.user?.username || blogger.user?.telegramUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-telegram-textSecondary text-sm md:text-lg hover:text-telegram-primary transition-colors flex items-center gap-1 w-fit"
                      >
                        @{blogger.user?.username || blogger.user?.telegramUsername || 'username'}
                        <Send className="w-3 h-3 ml-1 opacity-70" />
                      </a>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="flex flex-wrap gap-1.5">
                    {blogger.isFeatured && (
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-orange-500 text-black border border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        Выбор платформы
                      </span>
                    )}
                    {(blogger.categories || []).map((c: string) => (
                      <span 
                        key={c} 
                        className="text-[10px] md:text-xs font-medium uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-telegram-textSecondary border border-white/5"
                      >
                        {getCategoryLabel(c)}
                      </span>
                    ))}
                  </div>

                  {/* Price Badge - Compact & Aligned */}
                  {(blogger.pricePerPost > 0 || blogger.pricePerStory > 0) && (
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {blogger.pricePerPost > 0 && (
                        <div className="inline-flex items-baseline gap-1.5 bg-telegram-accent/10 border border-telegram-accent/20 px-2.5 py-1 rounded-lg">
                          <span className="text-[10px] text-telegram-accent/80 uppercase font-bold tracking-wider">Пост</span>
                          <span className="text-sm md:text-base font-bold text-telegram-accent">{formatPrice(blogger.pricePerPost)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-telegram-textSecondary mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Подписчики</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatNumber(blogger.subscribersCount || 0)}
                  </p>
                </div>
                <div className="text-center border-l border-white/5">
                  <div className="flex items-center justify-center gap-2 text-telegram-textSecondary mb-1">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">Просмотры</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-white">
                    {formatNumber(blogger.averageViews || 0)}
                  </p>
                </div>
                <div className="text-center border-l border-white/5">
                  <div className="flex items-center justify-center gap-2 text-telegram-textSecondary mb-1">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-sm">ER</span>
                  </div>
                  <p className="text-xl md:text-2xl font-bold text-telegram-accent">
                    {blogger.engagementRate || 0}%
                  </p>
                </div>
              </div>

              {/* Bio */}
              {blogger.bio && (
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-telegram-text leading-relaxed italic break-words whitespace-pre-wrap">
                    "{blogger.bio}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Social Platforms */}
        {platforms && platforms.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-white/5 bg-[#1C1E20] shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-telegram-primary" />
                  Социальные сети
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformsList 
                  platforms={platforms as any}
                  isAdmin={isAdmin}
                  telegramUsername={blogger.user?.username || blogger.user?.telegramUsername}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Admin Actions Panel - Premium Redesign */}
        {isAdmin && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
           >
             <div style={{
               background: 'rgba(30, 30, 46, 0.8)',
               backdropFilter: 'blur(12px)',
               border: '1px solid rgba(255, 255, 255, 0.08)',
               borderRadius: 24,
               padding: 20,
               boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
             }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                 <Shield className="text-telegram-primary" size={20} />
                 <h3 style={{ fontSize: 16, fontWeight: 600, color: 'white' }}>Управление профилем</h3>
               </div>
               
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                 {/* Feature / Unfeature */}
                 <button
                   onClick={async () => {
                     try {
                       await adminApi.updateBlogger(params.id || String(targetUserId), { isFeatured: !blogger.isFeatured })
                       await loadBlogger(params.id || String(targetUserId))
                     } catch (e: any) {
                       alert('Ошибка: ' + e.message)
                     }
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: blogger.isFeatured ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                     background: blogger.isFeatured ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                     color: blogger.isFeatured ? '#fbbf24' : 'rgba(255, 255, 255, 0.9)',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   <Star size={24} fill={blogger.isFeatured ? "currentColor" : "none"} />
                   {blogger.isFeatured ? 'В топе' : 'В топ'}
                 </button>

                 {/* Telegram Link */}
                 <button
                   onClick={() => {
                     const username = blogger.user?.username || blogger.user?.telegramUsername
                     if (username) {
                       window.open(`https://t.me/${username}`, '_blank')
                     } else {
                       alert('У пользователя нет username')
                     }
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: '1px solid rgba(51, 144, 236, 0.2)',
                     background: 'rgba(51, 144, 236, 0.1)',
                     color: '#3390ec',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   <Send size={24} />
                   Telegram
                 </button>

                 {/* Admin Note */}
                 <button
                   onClick={() => {
                     setNoteText(blogger.adminNotes || '')
                     setShowNoteModal(true)
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: blogger.adminNotes ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                     background: blogger.adminNotes ? 'rgba(234, 179, 8, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                     color: blogger.adminNotes ? '#eab308' : 'rgba(255, 255, 255, 0.9)',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   <FileText size={24} />
                   {blogger.adminNotes ? 'Смотреть заметку' : 'Создать заметку'}
                 </button>

                 {/* Edit Profile */}
                 <button
                   onClick={() => {
                     setEditForm({
                       firstName: blogger.user?.firstName || '',
                       lastName: blogger.user?.lastName || '',
                       bio: blogger.bio || '',
                       pricePerPost: blogger.pricePerPost || 0,
                     })
                     setShowEditModal(true)
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: '1px solid rgba(255, 255, 255, 0.1)',
                     background: 'rgba(255, 255, 255, 0.05)',
                     color: 'rgba(255, 255, 255, 0.9)',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   <Edit size={24} />
                   Редактировать
                 </button>

                 {/* Verify/Unverify */}
                 <button
                   onClick={async () => {
                     try {
                       const uid = targetUserId
                       if (blogger.isVerified) {
                         setUnverifyReason('')
                         setShowUnverifyInline(true)
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
                         setData((prev: any) => (prev ? { ...prev, isVerified: true } : prev))
                         try { router.refresh() } catch {}
                       }
                     } catch (e: any) {
                       alert(`Ошибка: ${e?.message || e}`)
                     }
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: blogger.isVerified ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(34, 197, 94, 0.2)',
                     background: blogger.isVerified ? 'rgba(255, 255, 255, 0.05)' : 'rgba(34, 197, 94, 0.1)',
                     color: blogger.isVerified ? 'rgba(255, 255, 255, 0.7)' : '#22c55e',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   {blogger.isVerified ? <Shield size={24} /> : <CheckCircle size={24} />}
                   {blogger.isVerified ? 'Снять галочку' : 'Верифицировать'}
                 </button>

                 {/* Block/Unblock */}
                 <button
                   onClick={async () => {
                     await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}/block`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${localStorage.getItem('influenta_token')}` } })
                     router.refresh()
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: blogger.user?.isActive === false ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(234, 179, 8, 0.2)',
                     background: blogger.user?.isActive === false ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                     color: blogger.user?.isActive === false ? '#22c55e' : '#eab308',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   {blogger.user?.isActive === false ? <Unlock size={24} /> : <Lock size={24} />}
                   {blogger.user?.isActive === false ? 'Разблокировать' : 'Заблокировать'}
                 </button>

                 {/* Delete */}
                 <button
                   onClick={async () => {
                     if (!confirm('Удалить пользователя навсегда?')) return
                     await fetch(
                       `${process.env.NEXT_PUBLIC_API_URL}/admin/users/${blogger.user?.id || blogger.id}`,
                       {
                         method: 'DELETE',
                         headers: { Authorization: `Bearer ${localStorage.getItem('influenta_token')}` },
                       },
                     )
                     router.back()
                   }}
                   style={{
                     padding: 16,
                     borderRadius: 16,
                     border: '1px solid rgba(239, 68, 68, 0.2)',
                     background: 'rgba(239, 68, 68, 0.1)',
                     color: '#ef4444',
                     fontSize: 14,
                     fontWeight: 600,
                     cursor: 'pointer',
                     display: 'flex',
                     flexDirection: 'column',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: 8,
                     transition: 'all 0.2s'
                   }}
                 >
                   <Trash2 size={24} />
                   Удалить
                 </button>
               </div>
             </div>
           </motion.div>
        )}

        {/* CTA Button - inside content, scrolls with page */}
        {user?.role === 'advertiser' && (
          <div style={{ marginTop: 40, marginBottom: 40, padding: '0 16px' }}>
            <button
              onClick={() => setShowOfferModal(true)}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #3390ec 0%, #2b7cd3 100%)',
                border: 'none',
                borderRadius: 16,
                color: 'white',
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 8px 24px rgba(51, 144, 236, 0.3)',
                touchAction: 'manipulation',
                position: 'relative',
                zIndex: 10
              }}
            >
              <MessageSquare size={20} />
              Предложить сотрудничество
            </button>
          </div>
        )}
      </div>

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

  {/* Edit Modal */}
  {showEditModal && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
      <div className="bg-[#1C1E20] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-bold text-white mb-6">Редактирование профиля</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-telegram-textSecondary mb-1">Имя</label>
            <input
              value={editForm.firstName}
              onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-telegram-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-telegram-textSecondary mb-1">Фамилия</label>
            <input
              value={editForm.lastName}
              onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-telegram-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-telegram-textSecondary mb-1">О себе</label>
            <textarea
              value={editForm.bio}
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
              rows={4}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-telegram-primary outline-none transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-telegram-textSecondary mb-1">Цена за пост (₽)</label>
            <input
              type="number"
              value={editForm.pricePerPost}
              onChange={(e) => setEditForm({...editForm, pricePerPost: Number(e.target.value)})}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-telegram-primary outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <Button variant="secondary" fullWidth onClick={() => setShowEditModal(false)}>Отмена</Button>
          <Button
            variant="primary"
            fullWidth
            className="bg-telegram-primary hover:bg-telegram-primary/90 text-white"
            onClick={async () => {
              try {
                await adminApi.updateBlogger(params.id || String(targetUserId), editForm)
                await loadBlogger(params.id || String(targetUserId))
                setShowEditModal(false)
              } catch (e: any) {
                alert('Ошибка сохранения: ' + e.message)
              }
            }}
          >
            Сохранить
          </Button>
        </div>
      </div>
    </div>
  )}

  {/* Note Modal */}
  {showNoteModal && (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNoteModal(false)}>
      <div className="bg-[#1C1E20] border border-white/10 rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <FileText className="text-yellow-500" />
          <h3 className="text-xl font-bold text-white">Секретная заметка</h3>
        </div>
        <p className="text-sm text-white/50 mb-4">Эту информацию видит только администратор.</p>
        
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Например: Отвечает долго, торгуется..."
          className="w-full h-40 bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 text-yellow-100 placeholder-yellow-500/30 focus:border-yellow-500/50 outline-none resize-none mb-6"
        />

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={() => setShowNoteModal(false)}>Закрыть</Button>
          <Button
            variant="primary"
            fullWidth
            className="bg-yellow-600 hover:bg-yellow-500 text-white border-none"
            onClick={async () => {
               try {
                await adminApi.updateBlogger(params.id || String(targetUserId), { adminNotes: noteText })
                await loadBlogger(params.id || String(targetUserId))
                setShowNoteModal(false)
              } catch (e: any) {
                alert('Ошибка сохранения: ' + e.message)
              }
            }}
          >
            Сохранить заметку
          </Button>
        </div>
      </div>
    </div>
  )}
    </div>
  )
}

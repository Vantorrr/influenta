'use client'

import { useState } from 'react'
import { Edit, Save, X, User, Mail, AtSign, FileText, Phone, Globe, Users2, DollarSign, Shield, CheckCircle, AlertCircle, Clock, Camera, Upload } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useRef } from 'react'
import { authApi, analyticsApi } from '@/lib/api'
import { UserRole } from '@/types'
import { VerificationModal } from '@/components/VerificationModal'
import { SocialPlatformsSection } from '@/components/profile/SocialPlatformsSection'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  useEffect(() => {
    if (user?.id) {
      try { analyticsApi.track('profile_view', { targetUserId: user.id }) } catch {}
    }
  }, [user?.id])
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    role: UserRole.BLOGGER,
    phone: '',
    website: '',
    telegramLink: '',
    instagramLink: '',
    photoUrl: '',
    // Для блогеров
    subscribersCount: '',
    pricePerPost: '',
    pricePerStory: '',
    categories: [] as string[]
  })

  const handleEdit = () => {
    analyticsApi.track('quick_action_click', { targetType: 'profile', targetId: 'edit' })
    if (user) {
      const rawCats: any = (user as any).categories
      const normalizedCategories = Array.isArray(rawCats)
        ? rawCats
        : typeof rawCats === 'string'
          ? rawCats.split(',').map((c: string) => c.trim()).filter(Boolean)
          : []
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        bio: user.bio || '',
        role: user.role || UserRole.BLOGGER,
        phone: (user as any).phone || '',
        website: (user as any).website || '',
        telegramLink: (user as any).telegramLink || '',
        instagramLink: (user as any).instagramLink || '',
        photoUrl: user.photoUrl || '',
        subscribersCount: (user as any).subscribersCount || '',
        pricePerPost: (user as any).pricePerPost || '',
        pricePerStory: (user as any).pricePerStory || '',
        categories: normalizedCategories,
      })
    }
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      // Нормализуем данные для API
      const payload: any = {
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        email: formData.email || undefined,
        bio: formData.bio || undefined,
        role: formData.role || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        telegramLink: formData.telegramLink || undefined,
        instagramLink: formData.instagramLink || undefined,
        photoUrl: formData.photoUrl || undefined,
      }

      if (formData.subscribersCount !== '') payload.subscribersCount = parseInt(String(formData.subscribersCount).replace(/\./g, ''), 10) || 0
      if (formData.pricePerPost !== '') payload.pricePerPost = parseInt(String(formData.pricePerPost).replace(/\./g, ''), 10) || 0
      if (formData.pricePerStory !== '') payload.pricePerStory = parseInt(String(formData.pricePerStory).replace(/\./g, ''), 10) || 0
      if (formData.categories && formData.categories.length > 0) payload.categories = formData.categories.join(',')

      console.log('Отправляем данные:', payload)
      const response = await authApi.updateProfile(payload)
      console.log('Profile update response:', response)
      try { analyticsApi.track('profile_edit_save', { targetUserId: user.id }) } catch {}
      
      // Получаем свежие данные с сервера
      const profileResponse = await authApi.getCurrentUser()
      console.log('Fresh profile data:', profileResponse)
      
      // Правильная структура ответа API
      const userData = (profileResponse as any)?.user || profileResponse
      if (userData?.id) {
        // Обновляем localStorage с данными с сервера
        localStorage.setItem('influenta_user', JSON.stringify(userData))
        
        // Принудительно обновляем страницу чтобы useAuth подхватил изменения
        window.location.reload()
      }
      
      setIsEditing(false)
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error)
      alert('Ошибка сохранения профиля. Попробуйте еще раз.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/uploads/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
        },
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Upload failed')

      // Если мы в режиме редактирования, обновляем formData
      if (isEditing) {
        setFormData(prev => ({ ...prev, photoUrl: data.url }))
      } else {
        // Иначе сразу сохраняем
        await authApi.updateProfile({ photoUrl: data.url })
        // Обновляем локальные данные
        const profileResponse = await authApi.getCurrentUser()
        const userData = (profileResponse as any)?.user || profileResponse
        if (userData?.id) {
          localStorage.setItem('influenta_user', JSON.stringify(userData))
          window.location.reload()
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
      alert('Не удалось загрузить аватарку')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      bio: '',
      role: UserRole.BLOGGER,
      phone: '',
      website: '',
      telegramLink: '',
      instagramLink: '',
      photoUrl: '',
      subscribersCount: '',
      pricePerPost: '',
      pricePerStory: '',
      categories: []
    })
  }

  const handleRequestVerification = () => {
    setShowVerificationModal(true)
  }

  const handleVerificationSubmit = async (data: {
    documents: string[]
    socialProofs: { platform: string; url: string; followers?: number }[]
    message: string
  }) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/request-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
      
      const result = await response.json()
      
      if (response.ok) {
        alert(result.message)
        setShowVerificationModal(false)
        // Обновляем профиль чтобы показать что заявка отправлена
        const profileResponse = await authApi.getCurrentUser()
        if ((profileResponse as any)?.user) {
          localStorage.setItem('influenta_user', JSON.stringify((profileResponse as any).user))
          window.location.reload()
        }
      } else {
        alert(result.message || 'Ошибка при отправке заявки')
      }
    } catch (error) {
      console.error('Error requesting verification:', error)
      alert('Ошибка при отправке заявки на верификацию')
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
        <p className="text-telegram-textSecondary">Загрузка профиля...</p>
      </div>
    </div>
  }

  if (!user) {
    return (
      <Layout title="Профиль">
        <div className="container py-6 max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl">Не авторизовано</h2>
            <p className="text-telegram-textSecondary mt-2">
              Откройте приложение как Telegram Mini App, чтобы войти автоматически
            </p>
          </div>
        </div>
      </Layout>
    )
  }

  // Временный debug
  console.log('🔍 Profile data:', user)
  console.log('🔍 Bio:', user.bio)
  console.log('🔍 Role:', user.role)
  console.log('🔍 SubscribersCount:', (user as any).subscribersCount)
  console.log('🔍 Categories:', (user as any).categories)

  return (
    <Layout title="Профиль">
      <div className="container py-6 max-w-4xl">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <Avatar
                  src={user.photoUrl}
                  firstName={user.firstName || 'Имя'}
                  lastName={user.lastName || 'Фамилия'}
                  size="xl"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold truncate">
                      {user.firstName} {user.lastName}
                    </h1>
                  </div>
                  <p className="text-telegram-textSecondary mb-2">
                    @{user.username || 'username'}
                  </p>
                  {user.isVerified && (
                    <div className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Верифицирован
                    </div>
                  )}
                  {user.bio && (
                    <p className="text-telegram-text mt-3">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t border-gray-700/50">
                {!isEditing ? (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Редактировать профиль
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Отмена
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Форма редактирования */}
        {isEditing && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Редактирование профиля</h3>
              
              {/* Секция загрузки фото */}
              <div className="mb-6 p-4 bg-telegram-bgSecondary rounded-lg">
                <div className="flex items-center gap-4">
                  <Avatar
                    src={formData.photoUrl || user.photoUrl}
                    firstName={formData.firstName || user.firstName || 'Имя'}
                    lastName={formData.lastName || user.lastName || 'Фамилия'}
                    size="lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Фото профиля</h4>
                    <p className="text-sm text-telegram-textSecondary mb-3">
                      Загрузите свою фотографию. Рекомендуемый размер 400x400 пикселей.
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      {avatarUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-telegram-primary"></div>
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Загрузить фото
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Имя */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Имя
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="Введите имя"
                  />
                </div>

                {/* Фамилия */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="Введите фамилию"
                  />
                </div>

                {/* Username - только отображение */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <AtSign className="w-4 h-4 inline mr-1" />
                    Username (Telegram)
                  </label>
                  <input
                    type="text"
                    value={user.username ? `@${user.username}` : 'Не указан (скрыт в Telegram)'}
                    disabled
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bgSecondary text-telegram-textSecondary cursor-not-allowed"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Синхронизируется с Telegram автоматически. Если у вас нет публичного @username, он не будет отображаться.</p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="Введите email"
                  />
                </div>

                {/* Роль */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Роль
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                  >
                    <option value={UserRole.BLOGGER}>Блогер</option>
                    <option value={UserRole.ADVERTISER}>Рекламодатель</option>
                  </select>
                </div>

                {/* Описание */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    О себе
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text resize-none"
                    placeholder="Расскажите о себе..."
                  />
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                {/* Сайт */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Сайт/Портфолио
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="https://example.com"
                  />
                </div>

                {/* Telegram ссылка */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <AtSign className="w-4 h-4 inline mr-1" />
                    Telegram канал
                  </label>
                  <input
                    type="url"
                    value={formData.telegramLink}
                    onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="https://t.me/channel"
                  />
                </div>

                {/* Instagram ссылка */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={formData.instagramLink}
                    onChange={(e) => setFormData({ ...formData, instagramLink: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="https://instagram.com/username"
                  />
                </div>

                {/* Дополнительные поля для блогеров */}
                {formData.role === UserRole.BLOGGER && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <Users2 className="w-4 h-4 inline mr-1" />
                        Количество подписчиков
                      </label>
                      <input
                        type="number"
                        value={formData.subscribersCount}
                        onChange={(e) => setFormData({ ...formData, subscribersCount: e.target.value })}
                        className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                        placeholder="10000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Цена за пост (₽)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerPost}
                        onChange={(e) => setFormData({ ...formData, pricePerPost: e.target.value })}
                        className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                        placeholder="5000"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Цена за сторис (₽)
                      </label>
                      <input
                        type="number"
                        value={formData.pricePerStory}
                        onChange={(e) => setFormData({ ...formData, pricePerStory: e.target.value })}
                        className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                        placeholder="2000"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Статистика профиля */}
        {user.role === UserRole.BLOGGER && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Статистика блогера</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-telegram-primary">
                    {(user as any).subscribersCount ? `${(user as any).subscribersCount}` : '0'}
                  </div>
                  <div className="text-sm text-telegram-textSecondary">Подписчики</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-telegram-accent">
                    {(user as any).pricePerPost ? `${(user as any).pricePerPost}₽` : 'Не указано'}
                  </div>
                  <div className="text-sm text-telegram-textSecondary">За пост</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-telegram-secondary">
                    {(user as any).pricePerStory ? `${(user as any).pricePerStory}₽` : 'Не указано'}
                  </div>
                  <div className="text-sm text-telegram-textSecondary">За сторис</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">
                    ⭐ 5.0
                  </div>
                  <div className="text-sm text-telegram-textSecondary">Рейтинг</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Контакты и ссылки */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Контакты и ссылки</h3>
            <div className="space-y-3">
              {((user as any).phone || (user as any).website || (user as any).telegramLink || (user as any).instagramLink) ? (
                <>
                  {(user as any).phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-telegram-textSecondary" />
                      <span>{(user as any).phone}</span>
                    </div>
                  )}
                  {(user as any).website && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-telegram-textSecondary" />
                      <a href={(user as any).website} target="_blank" rel="noopener noreferrer" 
                         className="text-telegram-primary hover:underline">
                        {(user as any).website}
                      </a>
                    </div>
                  )}
                  {(user as any).telegramLink && (
                    <div className="flex items-center gap-3">
                      <AtSign className="w-4 h-4 text-telegram-textSecondary" />
                      <a href={(user as any).telegramLink} target="_blank" rel="noopener noreferrer"
                         className="text-telegram-primary hover:underline">
                        Telegram канал
                      </a>
                    </div>
                  )}
                  {(user as any).instagramLink && (
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-telegram-textSecondary" />
                      <a href={(user as any).instagramLink} target="_blank" rel="noopener noreferrer"
                         className="text-telegram-primary hover:underline">
                        Instagram
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-telegram-textSecondary">Контакты не указаны</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Социальные сети для блогеров */}
        {user?.role === UserRole.BLOGGER && (
          <div className="mb-6">
            <SocialPlatformsSection />
          </div>
        )}

        {/* Информация о профиле */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Информация</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-telegram-textSecondary">Telegram ID:</span>
                <span className="font-mono">{user.telegramId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-telegram-textSecondary">Username:</span>
                <span>@{user.username || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-telegram-textSecondary">Роль:</span>
                <span className="capitalize">
                  {user.role === UserRole.BLOGGER ? 'Блогер' : 
                   user.role === UserRole.ADVERTISER ? 'Рекламодатель' : 'Не указана'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-telegram-textSecondary">Email:</span>
                <span>{user.email || 'Не указан'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-telegram-textSecondary">Статус:</span>
                <div className="flex items-center gap-2">
                  {user.isVerified ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-500 font-medium">Верифицирован</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-yellow-500" />
                      <span className="text-yellow-500">Не верифицирован</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Блок верификации */}
        {!user.isVerified && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  (user as any).verificationRequested ? 'bg-blue-100' : 
                  (user as any).verificationData?.rejectionReason ? 'bg-red-100' : 'bg-yellow-100'
                }`}>
                  {(user as any).verificationRequested ? (
                    <Clock className="w-6 h-6 text-blue-600" />
                  ) : (user as any).verificationData?.rejectionReason ? (
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <Shield className="w-6 h-6 text-yellow-600" />
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">
                    {(user as any).verificationRequested ? 'Заявка на рассмотрении' :
                     (user as any).verificationData?.rejectionReason ? 'Заявка отклонена' : 
                     'Пройдите верификацию'}
                  </h3>
                  
                  <p className="text-telegram-textSecondary mb-4">
                    {(user as any).verificationRequested ? 
                      'Администратор рассматривает вашу заявку. Обычно это занимает до 24 часов.' :
                     (user as any).verificationData?.rejectionReason ? (
                      <>
                        <span className="text-red-600 font-medium">Причина отказа:</span> {(user as any).verificationData.rejectionReason}
                      </>
                     ) : 
                      'Подтвердите владение аккаунтами и каналами для получения галочки верификации.'}
                  </p>
                  
                  {!(user as any).verificationRequested && (
                    <Button 
                      variant="primary"
                      onClick={handleRequestVerification}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {(user as any).verificationData?.rejectionReason ? 'Подать заявку заново' : 'Пройти верификацию'}
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Преимущества верификации */}
              <div className="mt-6 pt-6 border-t border-telegram-border">
                <h4 className="font-medium mb-3">Преимущества верификации:</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Доверие рекламодателей</div>
                      <div className="text-sm text-telegram-textSecondary">Верифицированные блогеры получают больше заказов</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Приоритет в поиске</div>
                      <div className="text-sm text-telegram-textSecondary">Ваш профиль будет выше в результатах</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Защита от мошенников</div>
                      <div className="text-sm text-telegram-textSecondary">Подтверждение подлинности аккаунта</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Модальное окно верификации */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onSubmit={handleVerificationSubmit}
      />
    </Layout>
  )
}
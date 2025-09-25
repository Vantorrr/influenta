'use client'

import { useState } from 'react'
import { Edit, Save, X, User, Mail, AtSign, FileText, Phone, Globe, Users2, DollarSign } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/lib/api'
import { UserRole } from '@/types'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
    // Для блогеров
    subscribersCount: '',
    pricePerPost: '',
    pricePerStory: '',
    categories: [] as string[]
  })

  const handleEdit = () => {
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
      }

      if (formData.subscribersCount !== '') payload.subscribersCount = parseInt(String(formData.subscribersCount).replace(/\./g, ''), 10) || 0
      if (formData.pricePerPost !== '') payload.pricePerPost = parseInt(String(formData.pricePerPost).replace(/\./g, ''), 10) || 0
      if (formData.pricePerStory !== '') payload.pricePerStory = parseInt(String(formData.pricePerStory).replace(/\./g, ''), 10) || 0
      if (formData.categories && formData.categories.length > 0) payload.categories = formData.categories.join(',')

      console.log('Отправляем данные:', payload)
      const response = await authApi.updateProfile(payload)
      console.log('Profile update response:', response)
      
      // Получаем свежие данные с сервера
      const profileResponse = await authApi.getCurrentUser()
      console.log('Fresh profile data:', profileResponse)
      
      // Правильная структура ответа API
      const userData = profileResponse?.user || profileResponse
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
      subscribersCount: '',
      pricePerPost: '',
      pricePerStory: '',
      categories: []
    })
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
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  src={user.photoUrl}
                  firstName={user.firstName || 'Имя'}
                  lastName={user.lastName || 'Фамилия'}
                  size="xl"
                />
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-telegram-textSecondary">
                    @{user.username || 'username'}
                  </p>
                  {user.bio && (
                    <p className="text-telegram-text mt-2 max-w-md">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>
              {!isEditing ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Редактировать
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Отмена
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Форма редактирования */}
        {isEditing && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Редактирование профиля</h3>
              
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
                    value={user.username || 'Не указан'}
                    disabled
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bgSecondary text-telegram-textSecondary cursor-not-allowed"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Синхронизируется с Telegram автоматически</p>
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

        {/* Информация о профиле */}
        <Card>
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
              <div className="flex justify-between">
                <span className="text-telegram-textSecondary">Статус:</span>
                <span className={user.isVerified ? 'text-green-500' : 'text-yellow-500'}>
                  {user.isVerified ? 'Верифицирован' : 'Не верифицирован'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
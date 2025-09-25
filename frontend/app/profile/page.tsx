'use client'

import { useState } from 'react'
import { Edit, Save, X, User, Mail, AtSign, FileText } from 'lucide-react'
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
    username: '',
    email: '',
    bio: '',
    role: UserRole.BLOGGER
  })

  const handleEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        role: user.role || UserRole.BLOGGER
      })
    }
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!user) return
    
    setIsSaving(true)
    try {
      await authApi.updateProfile(formData)
      // Обновляем данные пользователя в localStorage
      const updatedUser = { ...user, ...formData }
      localStorage.setItem('influenta_user', JSON.stringify(updatedUser))
      setIsEditing(false)
      // Можно добавить toast уведомление
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error)
      // Можно добавить toast с ошибкой
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      bio: '',
      role: UserRole.BLOGGER
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

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <AtSign className="w-4 h-4 inline mr-1" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-telegram-border rounded-lg bg-telegram-bg text-telegram-text"
                    placeholder="Введите username"
                  />
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
              </div>
            </CardContent>
          </Card>
        )}

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
                <span className="text-telegram-textSecondary">Роль:</span>
                <span className="capitalize">{user.role || 'Не указана'}</span>
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
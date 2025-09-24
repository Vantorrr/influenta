'use client'

import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-4 h-4 mr-1" />
                Редактировать
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <h2 className="text-xl">Профиль загружен!</h2>
          <p className="text-telegram-textSecondary mt-2">
            Пользователь: {user.firstName || 'Без имени'} {user.lastName || ''}
          </p>
          <p className="text-telegram-textSecondary">
            Telegram ID: {user.telegramId}
          </p>
        </div>
      </div>
    </Layout>
  )
}
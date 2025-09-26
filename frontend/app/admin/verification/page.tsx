'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, User, Calendar, Hash } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface VerificationRequest {
  id: string
  telegramId: string
  username?: string
  firstName: string
  lastName?: string
  role: string
  requestedAt: string
  subscribersCount?: number
  bio?: string
}

export default function VerificationPage() {
  const { user, checkAdminAccess } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!checkAdminAccess()) return
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/verification-requests`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error('Error fetching verification requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) throw new Error('Failed to verify')
      
      alert('Пользователь успешно верифицирован!')
      // Убираем из списка
      setRequests(prev => prev.filter(r => r.id !== userId))
    } catch (error) {
      console.error('Error verifying user:', error)
      alert('Ошибка при верификации пользователя')
    }
  }

  return (
    <Layout title="Заявки на верификацию">
      <div className="container py-6 max-w-6xl">
        <Card>
          <CardHeader>
            <CardTitle>Заявки на верификацию</CardTitle>
            <p className="text-sm text-telegram-textSecondary">
              Ожидают проверки: {requests.length}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-telegram-primary mx-auto mb-4"></div>
                <p className="text-telegram-textSecondary">Загрузка...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-telegram-textSecondary">Нет новых заявок</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-telegram-border rounded-lg p-4 hover:border-telegram-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <User className="w-5 h-5 text-telegram-textSecondary" />
                          <span className="font-semibold">
                            {request.firstName} {request.lastName}
                          </span>
                          {request.username && (
                            <span className="text-sm text-telegram-textSecondary">
                              @{request.username}
                            </span>
                          )}
                          <Badge variant={request.role === 'blogger' ? 'primary' : 'secondary'}>
                            {request.role === 'blogger' ? 'Блогер' : 'Рекламодатель'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-telegram-textSecondary">
                          <div className="flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            <span>{request.telegramId}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(request.requestedAt)}</span>
                          </div>
                          {request.subscribersCount && (
                            <div>
                              Подписчики: {request.subscribersCount.toLocaleString('ru-RU')}
                            </div>
                          )}
                        </div>
                        
                        {request.bio && (
                          <p className="text-sm text-telegram-text mt-2">
                            {request.bio}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleVerify(request.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Верифицировать
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

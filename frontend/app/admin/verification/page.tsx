'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, User, Calendar, Hash, FileText, Link as LinkIcon, MessageSquare } from 'lucide-react'
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
  verificationData?: {
    documents?: string[]
    socialProofs?: {
      platform: string
      url: string
      followers?: number
    }[]
    message?: string
  }
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

  const handleReject = async (userId: string, reason: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users/${userId}/reject-verification`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('influenta_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })
      
      if (!response.ok) throw new Error('Failed to reject')
      
      alert('Заявка отклонена')
      // Убираем из списка
      setRequests(prev => prev.filter(r => r.id !== userId))
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Ошибка при отклонении заявки')
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
                        
                        {/* Данные верификации */}
                        {request.verificationData && (
                          <div className="mt-4 space-y-3">
                            {/* Документы */}
                            {request.verificationData.documents && request.verificationData.documents.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <FileText className="w-4 h-4" />
                                  Документы ({request.verificationData.documents.length})
                                </div>
                                <div className="space-y-1">
                                  {request.verificationData.documents.map((doc, i) => (
                                    <a key={i} href={doc} target="_blank" rel="noopener noreferrer"
                                       className="text-xs text-telegram-primary hover:underline block truncate">
                                      {doc}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Социальные доказательства */}
                            {request.verificationData.socialProofs && request.verificationData.socialProofs.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <LinkIcon className="w-4 h-4" />
                                  Социальные сети
                                </div>
                                <div className="space-y-2">
                                  {request.verificationData.socialProofs.map((proof, i) => (
                                    <div key={i} className="text-xs">
                                      <span className="font-medium">{proof.platform}:</span>{' '}
                                      <a href={proof.url} target="_blank" rel="noopener noreferrer"
                                         className="text-telegram-primary hover:underline">
                                        {proof.url}
                                      </a>
                                      {proof.followers && (
                                        <span className="text-telegram-textSecondary ml-2">
                                          ({proof.followers.toLocaleString('ru-RU')} подписчиков)
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Сообщение */}
                            {request.verificationData.message && (
                              <div>
                                <div className="flex items-center gap-2 text-sm font-medium mb-2">
                                  <MessageSquare className="w-4 h-4" />
                                  Сообщение
                                </div>
                                <p className="text-xs text-telegram-text">
                                  {request.verificationData.message}
                                </p>
                              </div>
                            )}
                          </div>
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
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            const reason = prompt('Причина отказа:')
                            if (reason) handleReject(request.id, reason)
                          }}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Отклонить
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





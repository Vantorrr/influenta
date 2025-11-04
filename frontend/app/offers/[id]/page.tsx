'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { offersApi } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { 
  ArrowLeft, Clock, CheckCircle, XCircle, MessageSquare, 
  Calendar, User, Briefcase, FileText 
} from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'

export default function OfferDetailsPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuth()
  const [offer, setOffer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    if (params?.id) {
      loadOffer()
    }
  }, [params?.id])

  const loadOffer = async () => {
    try {
      setIsLoading(true)
      const response = await offersApi.getById(params.id)
      setOffer(response)
    } catch (error) {
      console.error('Failed to load offer:', error)
      router.push('/offers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespond = async (accept: boolean, rejectionReason?: string) => {
    try {
      setIsResponding(true)
      await offersApi.respond(offer.id, { accept, rejectionReason })
      
      if (accept) {
        alert('Предложение принято! Теперь вы можете общаться с рекламодателем в чате.')
        router.push('/messages')
      } else {
        alert('Предложение отклонено.')
        router.push('/offers')
      }
    } catch (error) {
      console.error('Failed to respond:', error)
      alert('Не удалось ответить на предложение')
    } finally {
      setIsResponding(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Ожидает ответа</Badge>
      case 'accepted':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Принято</Badge>
      case 'rejected':
        return <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />Отклонено</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
          <div className="text-telegram-textSecondary">Загрузка...</div>
        </div>
      </Layout>
    )
  }

  if (!offer) {
    return null
  }

  const isForBlogger = user?.role === 'blogger'
  const advertiserUser = offer.advertiser?.user
  const bloggerUser = offer.blogger?.user

  return (
    <Layout>
      <div className="min-h-screen bg-telegram-bg p-4 pb-20">
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/offers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к предложениям
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {offer.projectTitle || 'Предложение о сотрудничестве'}
                </h1>
                <div className="flex items-center gap-4 text-sm text-telegram-textSecondary">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(offer.createdAt)}
                  </div>
                  {offer.deadline && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Дедлайн: {formatDate(offer.deadline)}
                    </div>
                  )}
                </div>
              </div>
              {getStatusBadge(offer.status)}
            </div>

            {/* Информация о другой стороне */}
            <div className="bg-telegram-bgSecondary rounded-lg p-4 mb-4">
              <div className="flex items-center gap-3">
                {isForBlogger ? (
                  <Briefcase className="w-5 h-5 text-telegram-textSecondary" />
                ) : (
                  <User className="w-5 h-5 text-telegram-textSecondary" />
                )}
                <div>
                  <div className="font-medium">
                    {isForBlogger 
                      ? `${advertiserUser?.firstName} ${advertiserUser?.lastName || ''}`
                      : `${bloggerUser?.firstName} ${bloggerUser?.lastName || ''}`}
                  </div>
                  {isForBlogger && advertiserUser?.companyName && (
                    <div className="text-sm text-telegram-textSecondary">
                      {advertiserUser.companyName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Детали предложения */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <RubIcon className="w-4 h-4 text-telegram-textSecondary" />
                  <span className="font-medium">Бюджет</span>
                </div>
                <div className="text-xl font-bold text-telegram-primary">
                  {formatPrice(offer.proposedBudget)}
                </div>
              </div>

              {offer.format && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-telegram-textSecondary" />
                    <span className="font-medium">Формат</span>
                  </div>
                  <div>{offer.format}</div>
                </div>
              )}

              {offer.projectDescription && (
                <div>
                  <h3 className="font-medium mb-2">Описание проекта</h3>
                  <div className="text-telegram-textSecondary whitespace-pre-wrap">
                    {offer.projectDescription}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Сообщение</h3>
                <div className="bg-telegram-bg rounded-lg p-4 whitespace-pre-wrap">
                  {offer.message}
                </div>
              </div>
            </div>

            {/* Действия */}
            {offer.status === 'pending' && isForBlogger && (
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleRespond(true)}
                  disabled={isResponding}
                  fullWidth
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Принять предложение
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const reason = prompt('Укажите причину отказа (необязательно):')
                    handleRespond(false, reason || undefined)
                  }}
                  disabled={isResponding}
                  fullWidth
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Отклонить
                </Button>
              </div>
            )}

            {offer.status === 'accepted' && (
              <Button
                variant="primary"
                onClick={() => router.push('/messages')}
                fullWidth
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Перейти в чат
              </Button>
            )}

            {offer.status === 'rejected' && offer.rejectionReason && (
              <div className="bg-red-500/10 p-4 rounded-lg">
                <p className="text-red-500 font-medium mb-1">Предложение отклонено</p>
                <p className="text-sm">{offer.rejectionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}










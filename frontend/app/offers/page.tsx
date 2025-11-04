'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { offersApi } from '@/lib/api'
import { formatDate, formatPrice } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Clock, CheckCircle, XCircle, MessageSquare, Calendar } from 'lucide-react'
import { RubIcon } from '@/components/ui/ruble-icon'
import { useRouter } from 'next/navigation'

export default function OffersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadOffers()
  }, [])

  const loadOffers = async () => {
    try {
      setIsLoading(true)
      const response = await offersApi.getMy()
      setOffers(response.data || [])
    } catch (error) {
      console.error('Failed to load offers:', error)
      setOffers([])
    } finally {
      setIsLoading(false)
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

  const handleRespond = async (offerId: string, accept: boolean, rejectionReason?: string) => {
    try {
      await offersApi.respond(offerId, { accept, rejectionReason })
      await loadOffers()
      if (accept) {
        alert('Предложение принято! Теперь вы можете общаться с рекламодателем в чате.')
        router.push('/messages')
      } else {
        alert('Предложение отклонено.')
      }
    } catch (error) {
      console.error('Failed to respond:', error)
      alert('Не удалось ответить на предложение')
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-telegram-bg p-4 pb-20">
        <CardHeader>
          <CardTitle>
            {user?.role === 'blogger' ? 'Предложения о сотрудничестве' : 'Мои предложения'}
          </CardTitle>
        </CardHeader>

        {isLoading ? (
          <div className="text-center py-8 text-telegram-textSecondary">
            Загрузка...
          </div>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-telegram-textSecondary">
                {user?.role === 'blogger' 
                  ? 'У вас пока нет предложений от рекламодателей'
                  : 'Вы еще не отправляли предложений блогерам'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <Card key={offer.id} hover onClick={() => router.push(`/offers/${offer.id}`)}>
                <CardContent className="p-4 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {offer.projectTitle || 'Предложение о сотрудничестве'}
                      </h3>
                      <p className="text-sm text-telegram-textSecondary">
                        {user?.role === 'blogger' 
                          ? `От: ${offer.advertiser?.user?.firstName} ${offer.advertiser?.user?.lastName || ''}`
                          : `Блогеру: ${offer.blogger?.user?.firstName} ${offer.blogger?.user?.lastName || ''}`}
                      </p>
                      {user?.role === 'advertiser' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/bloggers/${offer.blogger?.user?.id || offer.blogger?.id}`)}
                          className="px-0 text-telegram-primary"
                        >
                          Открыть профиль блогера
                        </Button>
                      )}
                      {user?.role === 'blogger' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); /* нет публичной страницы рекламодателя */ alert('Профиль рекламодателя пока недоступен'); }}
                          className="px-0 text-telegram-textSecondary"
                        >
                          Рекламодатель: {offer.advertiser?.user?.firstName}
                        </Button>
                      )}
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <RubIcon className="w-4 h-4 text-telegram-textSecondary" />
                      <span>Бюджет: {formatPrice(offer.proposedBudget)}</span>
                    </div>
                    {offer.deadline && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-telegram-textSecondary" />
                        <span>Дедлайн: {formatDate(offer.deadline)}</span>
                      </div>
                    )}
                    {offer.format && (
                      <div className="flex items-center gap-2 text-sm">
                        <MessageSquare className="w-4 h-4 text-telegram-textSecondary" />
                        <span>Формат: {offer.format}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-telegram-bgSecondary p-3 rounded-lg mb-4">
                    <p className="text-sm">{offer.message}</p>
                  </div>

                  {offer.status === 'pending' && user?.role === 'blogger' && (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        onClick={() => handleRespond(offer.id, true)}
                        fullWidth
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Принять
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const reason = prompt('Укажите причину отказа (необязательно):')
                          handleRespond(offer.id, false, reason || undefined)
                        }}
                        fullWidth
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Отклонить
                      </Button>
                    </div>
                  )}

                  {offer.status === 'rejected' && offer.rejectionReason && (
                    <div className="bg-red-500/10 p-3 rounded-lg">
                      <p className="text-sm text-red-500">
                        Причина отказа: {offer.rejectionReason}
                      </p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}










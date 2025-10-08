'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, DollarSign, MessageSquare, Shield, Save, Trash2, X, Edit } from 'lucide-react'
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { listingsApi, responsesApi, messagesApi } from '@/lib/api'
import { formatDate, formatPrice, getCategoryLabel, getPostFormatLabel } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export default function ListingDetailsPage() {
  const params = useParams() as { id?: string }
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [listing, setListing] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Respond modal state
  const [showRespond, setShowRespond] = useState(false)
  const [message, setMessage] = useState('')
  const [price, setPrice] = useState('')
  const [respError, setRespError] = useState<string | null>(null)
  const [respLoading, setRespLoading] = useState(false)
  const [myResponses, setMyResponses] = useState<any[]>([])
  const [receivedResponses, setReceivedResponses] = useState<any[]>([])
  const [respActionLoading, setRespActionLoading] = useState<string | null>(null)

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ title: string; description: string; budget: string; format: string }>({ title: '', description: '', budget: '', format: 'post' })

  useEffect(() => {
    if (!user || !params?.id) return
    ;(async () => {
      try {
        const data = await listingsApi.getById(params.id!)
        const l = (data as any)?.data || data
        setListing(l)
        setEditData({
          title: l?.title || '',
          description: l?.description || '',
          budget: String(l?.budget || ''),
          format: String(l?.format || 'post')
        })
        // Если пришли из бота с фокусом на отклик — сразу открыть модалку
        const focus = searchParams?.get('focus')
        if (focus === 'response' && user?.role === 'blogger') {
          setShowRespond(true)
        }
        // Подгрузим мои отклики для этого объявления, чтобы показать кнопку чата
        try {
          const my = await responsesApi.getMyResponses('sent', 1, 50)
          const rows = (my as any)?.data || my?.data || []
          const mineForThis = rows.filter((r: any) => r.listingId === params.id)
          setMyResponses(mineForThis)
        } catch {}

        // Если я рекламодатель и это мое объявление — подгружаем все отклики
        const myAdvertiserId = (user as any)?.advertiser?.id
        const isOwner = user?.role === 'advertiser' && (
          (myAdvertiserId && l?.advertiserId === myAdvertiserId) ||
          l?.advertiser?.userId === user?.id ||
          l?.advertiser?.user?.telegramId === user?.telegramId
        )
        if (isOwner) {
          try {
            const respList = await responsesApi.getByListing(params.id!)
            const list = (respList as any)?.data || respList?.data || []
            setReceivedResponses(list)
          } catch {}
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || e?.message || 'Объявление не найдено')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [user, params?.id])

  const canRespond = user?.role === 'blogger'
  // canEdit только если это МОЁ объявление
  const isMyListing = user?.role === 'advertiser' && (
    listing?.advertiser?.userId === user.id ||
    listing?.advertiser?.user?.id === user.id ||
    listing?.advertiser?.user?.telegramId === user.telegramId
  )
  const canEdit = isMyListing
  const canSeeResponses = isMyListing

  const handleSendResponse = async () => {
    if (!params?.id) return
    setRespError(null)
    if (!message.trim() || !price) {
      setRespError('Заполните сообщение и предложенную цену')
      return
    }
    setRespLoading(true)
    try {
      await responsesApi.create({
        listingId: params.id!,
        message: message.trim(),
        proposedPrice: parseInt(price, 10) || 0,
      })
      setShowRespond(false)
      setMessage('')
      setPrice('')
      alert('Отклик отправлен. Рекламодатель получит уведомление в Telegram')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message
      setRespError(Array.isArray(msg) ? msg.join(', ') : String(msg || 'Не удалось отправить отклик'))
    } finally {
      setRespLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-telegram-bg flex items-center justify-center">
        <div className="text-telegram-textSecondary">Загрузка объявления...</div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-telegram-bg p-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>
        <Card>
          <CardContent className="p-6 text-center text-telegram-textSecondary">{String(error || 'Объявление не найдено')}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Layout>
      <div className="container py-4 space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-telegram-primary">
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              <span className="truncate">{listing.title}</span>
              <div className="flex items-center gap-2">
                <Badge variant="default">{getPostFormatLabel(listing.format)}</Badge>
                {listing.advertiser?.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-telegram-success">
                    <Shield className="w-3 h-3" /> Проверенный
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-telegram-textSecondary whitespace-pre-wrap">{listing.description}</div>

            <div className="flex flex-wrap gap-2">
              {(listing.targetCategories || []).map((c: string) => (
                <Badge key={c} variant="default">{getCategoryLabel(c)}</Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-telegram-textSecondary">Бюджет</p>
                <p className="font-medium">{formatPrice(listing.budget || 0)}</p>
              </div>
              {listing.deadline && (
                <div>
                  <p className="text-telegram-textSecondary">Дедлайн</p>
                  <p className="font-medium flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(listing.deadline)}</p>
                </div>
              )}
              <div>
                <p className="text-telegram-textSecondary">Откликов</p>
                <p className="font-medium">{listing.responsesCount || 0}</p>
              </div>
            </div>

            {canRespond && (
              <div className="pt-2">
                <Button variant="primary" onClick={() => setShowRespond(true)}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Откликнуться
                </Button>
              </div>
            )}
            {/* Кнопка переписки для автора отклика */}
            {user?.role === 'blogger' && myResponses.length > 0 && (
              <div className="pt-4 border-t border-gray-700/50 mt-4">
                <p className="text-sm text-telegram-textSecondary mb-2">Вы откликнулись на это объявление</p>
                <Button variant="primary" fullWidth onClick={() => {
                  const resp = myResponses[0]
                  window.location.href = `/messages?responseId=${resp.id}`
                }}>
                  💬 Открыть чат по отклику
                </Button>
              </div>
            )}
            {canEdit && (
              <div className="pt-4 border-t border-gray-700/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowEdit(true)}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <Edit className="w-4 h-4" />
                  Редактировать
                </Button>
                <Button 
                  variant="danger" 
                  onClick={async () => {
                    if (!confirm('Удалить объявление?')) return
                    try {
                      await listingsApi.delete(params.id!)
                      alert('Объявление удалено')
                      router.push('/listings')
                    } catch (e: any) {
                      alert(String(e?.response?.data?.message || e?.message || 'Не удалось удалить'))
                    }
                  }}
                  className="flex items-center justify-center gap-2 w-full"
                >
                  <Trash2 className="w-4 h-4" />
                  Удалить
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Список откликов для рекламодателя */}
        {canSeeResponses && receivedResponses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Отклики ({receivedResponses.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {receivedResponses.map((r: any) => (
                <div key={r.id} className="p-3 bg-telegram-bgSecondary rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {r.blogger?.user?.firstName} {r.blogger?.user?.lastName}
                      </p>
                      <p className="text-sm text-telegram-textSecondary">
                        @{r.blogger?.user?.username}
                      </p>
                      <p className="text-sm text-telegram-textSecondary mt-2">{r.message}</p>
                      {r.proposedPrice && (
                        <p className="text-sm font-medium mt-1">
                          Предложенная цена: {formatPrice(r.proposedPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => { window.location.href = `/messages?responseId=${r.id}` }}
                    >
                      Написать
                    </Button>
                    {r.status === 'pending' && (
                      <>
                        <Button 
                          variant="primary" 
                          size="sm"
                          disabled={respActionLoading === r.id} 
                          onClick={async () => {
                            try {
                              setRespActionLoading(r.id)
                              await responsesApi.accept(r.id)
                              setReceivedResponses(prev => prev.map(x => x.id === r.id ? { ...x, status: 'accepted', acceptedAt: new Date().toISOString() } : x))
                            } catch (e: any) {
                              alert(String(e?.response?.data?.message || e?.message || 'Не удалось принять'))
                            } finally {
                              setRespActionLoading(null)
                            }
                          }}
                        >
                          Принять
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          disabled={respActionLoading === r.id} 
                          onClick={async () => {
                            const reason = prompt('Причина отказа:') || 'Недостаточно данных'
                            try {
                              setRespActionLoading(r.id)
                              await responsesApi.reject(r.id, reason)
                              setReceivedResponses(prev => prev.map(x => x.id === r.id ? { ...x, status: 'rejected', rejectionReason: reason, rejectedAt: new Date().toISOString() } : x))
                            } catch (e: any) {
                              alert(String(e?.response?.data?.message || e?.message || 'Не удалось отклонить'))
                            } finally {
                              setRespActionLoading(null)
                            }
                          }}
                        >
                          Отклонить
                        </Button>
                      </>
                    )}
                    {r.status === 'accepted' && (
                      <Badge variant="success" className="text-xs">
                        ✓ Принят
                      </Badge>
                    )}
                    {r.status === 'rejected' && (
                      <Badge variant="danger" className="text-xs">
                        ✗ Отклонен
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Respond modal */}
        {showRespond && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={() => setShowRespond(false)}>
            <div className="bg-telegram-bgSecondary w-full md:max-w-lg rounded-t-2xl md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Отправить отклик</h3>
              <div className="space-y-3">
                <div>
                  <label className="label">Сообщение</label>
                  <textarea className="input min-h-[100px] resize-none" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Коротко опишите предложение" />
                </div>
                <div>
                  <label className="label">Предложенная цена (₽)</label>
                  <Input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="Например: 10000"
                    min="100"
                    step="100"
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <p className="text-xs text-telegram-textSecondary mt-1">Введите желаемую сумму за размещение</p>
                </div>
                {respError && <div className="text-telegram-danger text-sm">{respError}</div>}
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={() => setShowRespond(false)}>Отмена</Button>
                  <Button variant="primary" fullWidth onClick={handleSendResponse} disabled={respLoading}>
                    <DollarSign className="w-4 h-4 mr-2" /> {respLoading ? 'Отправка...' : 'Отправить'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={() => setShowEdit(false)}>
            <div className="bg-telegram-bgSecondary w-full md:max-w-2xl rounded-t-2xl md:rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Редактирование объявления</h3>
                <button className="p-2 hover:bg-telegram-bg rounded-lg" onClick={() => setShowEdit(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="label">Заголовок</label>
                  <Input value={editData.title} onChange={(e) => setEditData(s => ({ ...s, title: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Описание</label>
                  <textarea className="input min-h-[120px] resize-none" value={editData.description} onChange={(e) => setEditData(s => ({ ...s, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Бюджет (₽)</label>
                    <Input type="number" value={editData.budget} onChange={(e) => setEditData(s => ({ ...s, budget: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Формат</label>
                    <select className="input" value={editData.format} onChange={(e) => setEditData(s => ({ ...s, format: e.target.value }))}>
                      <option value="post">Пост</option>
                      <option value="story">Сторис</option>
                      <option value="live">Эфир/Reels</option>
                    </select>
                  </div>
                </div>
                {editError && <div className="text-telegram-danger text-sm">{editError}</div>}
                <div className="flex gap-3 pt-1">
                  <Button variant="secondary" fullWidth onClick={() => setShowEdit(false)}>Отмена</Button>
                  <Button variant="primary" fullWidth onClick={async () => {
                    setEditError(null)
                    setEditLoading(true)
                    try {
                      const payload: any = {
                        title: editData.title || undefined,
                        description: editData.description || undefined,
                        budget: editData.budget ? parseFloat(editData.budget) : undefined,
                        format: editData.format || undefined,
                      }
                      console.log('Updating listing:', params.id, payload)
                      await listingsApi.update(params.id!, payload)
                      alert('Сохранено')
                      setShowEdit(false)
                      router.refresh()
                    } catch (e: any) {
                      console.error('Update error:', e)
                      const msg = e?.response?.data?.message || e?.message || 'Не удалось сохранить'
                      setEditError(Array.isArray(msg) ? msg.join(', ') : String(msg))
                    } finally {
                      setEditLoading(false)
                    }
                  }} disabled={editLoading}>
                    <Save className="w-4 h-4 mr-2" /> {editLoading ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}





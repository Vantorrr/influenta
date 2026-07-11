'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, Calendar, MessageSquare, Shield, Save, Trash2, 
  X, Edit, CheckCircle, AlertCircle, Clock, User, 
  ChevronRight, Target, LayoutGrid, Banknote, Send
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { listingsApi, responsesApi } from '@/lib/api'
import { formatDate, formatPrice, getCategoryLabel, getPostFormatLabel } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// Стили (копии из ProfilePage для консистентности)
const cardStyle = {
  background: 'rgba(30, 30, 46, 0.6)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 24,
  padding: 24,
  marginBottom: 20,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
}

const buttonPrimaryStyle = {
  width: '100%',
  padding: '14px',
  background: 'linear-gradient(135deg, #3390ec, #2b7cd3)',
  border: 'none',
  borderRadius: 14,
  color: 'white',
  fontWeight: 600 as const,
  fontSize: 15,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 12px rgba(51, 144, 236, 0.3)',
  transition: 'transform 0.1s'
}

const buttonSecondaryStyle = {
  width: '100%',
  padding: '14px',
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 14,
  color: 'white',
  fontWeight: 600 as const,
  fontSize: 15,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'background 0.2s'
}

const buttonDangerStyle = {
  ...buttonSecondaryStyle,
  color: '#ef4444',
  borderColor: 'rgba(239, 68, 68, 0.2)',
  background: 'rgba(239, 68, 68, 0.1)',
}

const inputStyle = {
  width: '100%',
  padding: '12px 16px',
  background: 'rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  color: 'white',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s',
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500 as const,
  color: 'rgba(255, 255, 255, 0.5)',
  marginBottom: 8
}

const modalOverlayStyle = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  backdropFilter: 'blur(8px)',
  zIndex: 100, // Выше меню
  display: 'flex',
  alignItems: 'flex-end', // Шторка снизу
  justifyContent: 'center',
}

const modalContentStyle = {
  background: '#1a1a2e',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  borderLeft: '1px solid rgba(255,255,255,0.1)',
  borderRight: '1px solid rgba(255,255,255,0.1)',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  padding: '24px 24px 100px 24px', // Большой паддинг снизу для навигации
  width: '100%',
  maxWidth: 600,
  maxHeight: '90vh',
  overflowY: 'auto' as const,
  boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
  animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
}

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

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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
        
        const focus = searchParams?.get('focus')
        if (focus === 'response' && user?.role === 'blogger') {
          setShowRespond(true)
        }
        
        try {
          const my = await responsesApi.getMyResponses('sent', 1, 50)
          const rows = (my as any)?.data || my?.data || []
          const mineForThis = rows.filter((r: any) => r.listingId === params.id)
          setMyResponses(mineForThis)
        } catch {}

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

  const canRespond = user?.role === 'blogger' && listing?.status === 'active'
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
      alert('Отклик отправлен!')
      window.location.reload()
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message
      setRespError(Array.isArray(msg) ? msg.join(', ') : String(msg || 'Не удалось отправить отклик'))
    } finally {
      setRespLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.5)' }}>Загрузка...</div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="container" style={{ padding: 20 }}>
          <button onClick={() => router.back()} style={{ ...buttonSecondaryStyle, width: 'auto', padding: '8px 16px', marginBottom: 20 }}>
            <ArrowLeft size={16} /> Назад
          </button>
          <div style={{ textAlign: 'center', color: 'white' }}>{String(error || 'Объявление не найдено')}</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      <div className="container" style={{ padding: '20px 16px 100px' }}>
        <button 
          onClick={() => router.back()} 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            color: '#3390ec', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            fontSize: 15,
            fontWeight: 500,
            marginBottom: 16,
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={20} /> 
          Назад
        </button>

        <div style={{
          ...cardStyle,
          ...(listing.useSafeDeal ? {
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.12)',
          } : {}),
        }}>
          {listing.useSafeDeal && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 16,
            }}>
              <Shield size={15} />
              Безопасная сделка
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'white', lineHeight: 1.3, flex: 1, paddingRight: 16 }}>
              {listing.title}
            </h1>
            <div style={{ 
              padding: '6px 12px', 
              background: 'rgba(51, 144, 236, 0.15)', 
              color: '#3390ec', 
              borderRadius: 10, 
              fontWeight: 600, 
              fontSize: 13,
              whiteSpace: 'nowrap'
            }}>
              {getPostFormatLabel(listing.format)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(listing.targetCategories || []).map((c: string) => (
              <span key={c} style={{ 
                fontSize: 12, 
                padding: '4px 10px', 
                borderRadius: 8, 
                background: 'rgba(255,255,255,0.1)', 
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {getCategoryLabel(c)}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 24, whiteSpace: 'pre-wrap' }}>
            {listing.description}
          </p>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 12, 
            padding: 16, 
            background: 'rgba(0,0,0,0.2)', 
            borderRadius: 16 
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Бюджет</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#22c55e' }}>
                {formatPrice(listing.budget || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Дедлайн</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={16} style={{ opacity: 0.7 }} />
                {listing.deadline ? formatDate(listing.deadline) : '—'}
              </div>
            </div>
          </div>

          {listing.advertiser?.isVerified && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: '#22c55e' }}>
              <Shield size={16} />
              <span>Проверенный рекламодатель</span>
            </div>
          )}
        </div>

        {canRespond && (
          <button 
            onClick={() => setShowRespond(true)}
            style={buttonPrimaryStyle}
          >
            <MessageSquare size={18} />
            Откликнуться
          </button>
        )}

        {user?.role === 'blogger' && myResponses.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'center' }}>
              Вы уже откликнулись на это задание
            </div>
            <button 
              onClick={() => {
                const resp = myResponses[0]
                window.location.href = `/messages?responseId=${resp.id}`
              }}
              style={buttonSecondaryStyle}
            >
              💬 Перейди к переписке
            </button>
          </div>
        )}

        {canEdit && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button onClick={() => setShowEdit(true)} style={buttonSecondaryStyle}>
                <Edit size={18} /> Редактировать
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                style={buttonDangerStyle}
              >
                <Trash2 size={18} /> Удалить
              </button>
            </div>
          </div>
        )}

        {/* Responses List */}
        {canSeeResponses && receivedResponses.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', marginBottom: 16 }}>
              Отклики ({receivedResponses.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {receivedResponses.map((r: any) => (
                <div key={r.id} style={{ 
                  ...cardStyle, 
                  marginBottom: 0, 
                  padding: 16,
                  borderColor: r.status === 'accepted' ? 'rgba(34, 197, 94, 0.3)' : r.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div 
                      style={{ fontWeight: 600, color: 'white', cursor: 'pointer' }}
                      onClick={() => window.location.href = `/bloggers/${r.blogger?.user?.id}`}
                    >
                      {r.blogger?.user?.firstName} {r.blogger?.user?.lastName}
                      {r.status === 'accepted' && <span style={{ fontSize: 12, color: '#22c55e', marginLeft: 8 }}>✅ Принят</span>}
                      {r.status === 'rejected' && <span style={{ fontSize: 12, color: '#ef4444', marginLeft: 8 }}>❌ Отклонён</span>}
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>@{r.blogger?.user?.username}</div>
                    </div>
                    {r.proposedPrice && (
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#3390ec' }}>
                        {formatPrice(r.proposedPrice)}
                      </div>
                    )}
                  </div>
                  
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 16, background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12 }}>
                    {r.message}
                  </p>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      onClick={() => { window.location.href = `/messages?responseId=${r.id}` }}
                      style={{ ...buttonSecondaryStyle, padding: '8px', fontSize: 13 }}
                    >
                      Написать
                    </button>
                    {r.status === 'pending' && (
                      <>
                        <button 
                          onClick={async () => {
                            try {
                              setRespActionLoading(r.id)
                              await responsesApi.accept(r.id)
                              window.location.reload()
                            } catch(e) { alert('Ошибка') }
                          }}
                          style={{ ...buttonPrimaryStyle, flex: 1, padding: '8px', fontSize: 13 }}
                        >
                          Принять
                        </button>
                        <button 
                          onClick={async () => {
                            try {
                              await responsesApi.reject(r.id, 'Отказ')
                              window.location.reload()
                            } catch(e) { alert('Ошибка') }
                          }}
                          style={{ ...buttonDangerStyle, padding: '8px', fontSize: 13 }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Respond Modal */}
      {showRespond && (
        <div style={modalOverlayStyle} onClick={() => setShowRespond(false)}>
          <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white' }}>Откликнуться</h3>
              <button onClick={() => setShowRespond(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Сопроводительное письмо</label>
              <textarea 
                style={{ ...inputStyle, minHeight: 120, resize: 'none' }} 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                placeholder="Напишите, почему вы подходите для этого задания..." 
              />
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>Предложенная цена (₽)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  style={{ ...inputStyle, fontSize: 18, fontWeight: 600, paddingLeft: 16 }} 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="10000" 
                />
                <div style={{ position: 'absolute', right: 16, top: 14, color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>RUB</div>
              </div>
            </div>

            {respError && (
              <div style={{ color: '#ef4444', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
                {respError}
              </div>
            )}

            <button 
              onClick={handleSendResponse} 
              disabled={respLoading}
              style={buttonPrimaryStyle}
            >
              {respLoading ? 'Отправка...' : 'Отправить отклик'}
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div style={modalOverlayStyle} onClick={() => setShowEdit(false)}>
          <div style={{ ...modalContentStyle, paddingBottom: 100 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 24 }}>Редактирование</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Заголовок</label>
                <input style={inputStyle} value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>Описание</label>
                <textarea style={{ ...inputStyle, minHeight: 100 }} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Бюджет</label>
                  <input type="number" style={inputStyle} value={editData.budget} onChange={e => setEditData({...editData, budget: e.target.value})} />
                </div>
                <div>
                  <label style={labelStyle}>Формат</label>
                  <select style={inputStyle} value={editData.format} onChange={e => setEditData({...editData, format: e.target.value})}>
                    <option value="post">Пост</option>
                    <option value="story">Сторис</option>
                    <option value="reels">Reels</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <button onClick={() => setShowEdit(false)} style={buttonSecondaryStyle}>Отмена</button>
              <button onClick={async () => {
                setEditLoading(true)
                try {
                  await listingsApi.update(params.id!, {
                    ...editData,
                    budget: parseFloat(editData.budget)
                  } as any)
                  setShowEdit(false)
                  window.location.reload()
                } catch(e) { alert('Ошибка') }
                finally { setEditLoading(false) }
              }} style={buttonPrimaryStyle}>
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={modalOverlayStyle} onClick={() => setShowDeleteConfirm(false)}>
          <div style={{ ...modalContentStyle, paddingBottom: 100 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 16 }}>Удалить объявление?</h3>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
              Это действие нельзя отменить. Все отклики на это объявление также будут удалены.
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                style={buttonSecondaryStyle}
              >
                Отмена
              </button>
              <button 
                onClick={async () => {
                  setDeleteLoading(true)
                  try {
                    await listingsApi.delete(params.id!)
                    router.push('/listings')
                  } catch (e: any) {
                    console.error('Delete error:', e)
                    setShowDeleteConfirm(false)
                  } finally {
                    setDeleteLoading(false)
                  }
                }} 
                disabled={deleteLoading}
                style={{ ...buttonDangerStyle, opacity: deleteLoading ? 0.6 : 1 }}
              >
                <Trash2 size={18} /> 
                {deleteLoading ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

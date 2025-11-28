'use client'

import { useState, useRef, useEffect, Component, ReactNode } from 'react'
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react'
import { messagesApi } from '@/lib/api'
import { chatService } from '@/lib/chat.service'

// Error Boundary для отлова ошибок рендера
class ErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: any, info: any) {
    console.error('ChatWindow error:', error, info)
    this.props.onError()
  }
  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date
  isRead: boolean
}

interface ChatWindowProps {
  chat: any
  currentUserId: string
  onBack: () => void
}

export function ChatWindow({ chat, currentUserId, onBack }: ChatWindowProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<any>(null)

  // Безопасное получение данных
  let responseId = ''
  let otherFirstName = 'Пользователь'
  let otherLastName = ''
  let otherPhotoUrl = ''
  let listingTitle = 'Объявление'
  let chatStatus = ''
  
  try {
    responseId = chat?.responseId ? String(chat.responseId) : ''
    otherFirstName = chat?.otherUser?.firstName ? String(chat.otherUser.firstName) : 'Пользователь'
    otherLastName = chat?.otherUser?.lastName ? String(chat.otherUser.lastName) : ''
    otherPhotoUrl = chat?.otherUser?.photoUrl ? String(chat.otherUser.photoUrl) : ''
    listingTitle = chat?.listingTitle ? String(chat.listingTitle) : 'Объявление'
    chatStatus = chat?.status ? String(chat.status) : ''
  } catch (e) {
    console.error('Error parsing chat data:', e)
  }

  useEffect(() => {
    if (!responseId) {
      setError('Нет ID чата')
      setLoading(false)
      return
    }

    let isMounted = true

    const loadMessages = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const res = await messagesApi.getByResponse(responseId, 1, 200)
        
        if (!isMounted) return

        // Безопасно достаём массив
        let items: any[] = []
        try {
          if (Array.isArray(res)) {
            items = res
          } else if (res && typeof res === 'object') {
            if (Array.isArray((res as any).data)) {
              items = (res as any).data
            } else if (Array.isArray((res as any).items)) {
              items = (res as any).items
            }
          }
        } catch (e) {
          console.error('Error extracting items:', e)
          items = []
        }

        const parsed: Message[] = []
        for (let i = 0; i < items.length; i++) {
          try {
            const m = items[i]
            if (!m) continue
            parsed.push({
              id: String(m.id || `msg-${i}`),
              content: String(m.text || m.content || ''),
              senderId: String(m.userId || m.senderId || ''),
              createdAt: new Date(m.createdAt || Date.now()),
              isRead: Boolean(m.isRead),
            })
          } catch (e) {
            console.error('Error parsing message:', e)
          }
        }

        setMessages(parsed.reverse())
        setLoading(false)

        // Отмечаем как прочитанные
        for (const m of parsed) {
          if (!m.isRead && m.senderId !== currentUserId) {
            try { await messagesApi.markAsRead(m.id) } catch {}
          }
        }
      } catch (e) {
        console.error('Error loading messages:', e)
        if (isMounted) {
          setError('Ошибка загрузки сообщений')
          setLoading(false)
        }
      }
    }

    loadMessages()

    // Подключаем сокеты
    try {
      chatService.joinChat(responseId)
      
      const onNewMessage = (data: any) => {
        if (!data || data.responseId !== responseId) return
        const msg: Message = {
          id: String(data.id || Date.now()),
          content: String(data.text || data.content || ''),
          senderId: String(data.userId || data.senderId || ''),
          createdAt: new Date(data.createdAt || Date.now()),
          isRead: Boolean(data.isRead),
        }
        setMessages(prev => [...prev, msg])
        if (msg.senderId !== currentUserId) {
          try { messagesApi.markAsRead(msg.id) } catch {}
        }
      }

      const onTypingEvent = (data: any) => {
        if (!data || data.responseId !== responseId || data.userId === currentUserId) return
        setIsTyping(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setIsTyping(false), 1500)
      }

      chatService.on('message', onNewMessage)
      chatService.on('typing', onTypingEvent)

      return () => {
        isMounted = false
        try { chatService.leaveChat(responseId) } catch {}
        chatService.off('message', onNewMessage)
        chatService.off('typing', onTypingEvent)
      }
    } catch (e) {
      console.error('Socket error:', e)
    }

    return () => {
      isMounted = false
    }
  }, [responseId, currentUserId])

  // Автоскролл
  useEffect(() => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch (e) {}
  }, [messages])

  const sendMessage = async () => {
    const text = message.trim()
    if (!text || !responseId) return
    
    setMessage('')
    
    try {
      const res = await messagesApi.send(responseId, text)
      const m = (res as any)?.data || res || {}
      const newMsg: Message = {
        id: String(m.id || Date.now()),
        content: String(m.text || m.content || text),
        senderId: String(m.userId || m.senderId || currentUserId),
        createdAt: new Date(m.createdAt || Date.now()),
        isRead: Boolean(m.isRead),
      }
      setMessages(prev => [...prev, newMsg])
      try { chatService.stopTyping(responseId) } catch {}
    } catch (e: any) {
      console.error('Send error:', e)
      setMessage(text)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    try { chatService.startTyping(responseId) } catch {}
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    try {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  // Генерация градиента для аватара
  const getAvatarGradient = (name: string) => {
    const colors = [
      ['#FF6B6B', '#FF8E53'],
      ['#4ECDC4', '#44A08D'],
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
    ]
    const index = name.charCodeAt(0) % colors.length
    return `linear-gradient(135deg, ${colors[index][0]}, ${colors[index][1]})`
  }

  // Показ ошибки
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        height: '100%', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: 24,
        background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 100%)'
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: '50%', 
          background: 'rgba(239, 68, 68, 0.2)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <span style={{ fontSize: 32 }}>😔</span>
        </div>
        <p style={{ color: '#ef4444', marginBottom: 16, textAlign: 'center' }}>{error}</p>
        <button 
          onClick={onBack} 
          style={{ 
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3390ec, #2b7cd3)',
            border: 'none',
            borderRadius: 12,
            color: 'white',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          ← Назад к чатам
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={() => setError('Произошла ошибка')}>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        height: '100%',
        background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a2e 100%)'
      }}>
        {/* Заголовок - Premium стиль */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 12, 
          padding: '12px 16px',
          background: 'rgba(30, 30, 46, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          position: 'relative'
        }}>
          {/* Градиентная линия сверху */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, #3390ec, #9b59b6, #3390ec)',
            opacity: 0.8
          }} />
          
          <button 
            onClick={onBack} 
            style={{ 
              padding: 8, 
              borderRadius: 10, 
              background: 'rgba(255,255,255,0.05)', 
              border: 'none', 
              color: 'white', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          
          {/* Аватар с градиентом */}
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: '50%', 
            background: otherPhotoUrl ? 'transparent' : getAvatarGradient(otherFirstName),
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            color: 'white', 
            fontSize: 18,
            fontWeight: 600,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(51, 144, 236, 0.3)'
          }}>
            {otherPhotoUrl ? (
              <img src={otherPhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              otherFirstName.charAt(0).toUpperCase()
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 600, 
              color: 'white',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              {otherFirstName} {otherLastName}
              {chatStatus === 'accepted' && (
                <span style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))',
                  color: '#22c55e',
                  fontWeight: 500
                }}>
                  Сотрудничество
                </span>
              )}
            </div>
            <div style={{ 
              fontSize: 13, 
              color: 'rgba(255,255,255,0.5)',
              marginTop: 2
            }}>
              {listingTitle}
            </div>
          </div>
        </div>

        {/* Сообщения */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.5)',
              padding: 40 
            }}>
              <div style={{
                width: 40,
                height: 40,
                margin: '0 auto 12px',
                border: '3px solid rgba(51, 144, 236, 0.2)',
                borderTopColor: '#3390ec',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Загрузка сообщений...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          
          {!loading && messages.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              color: 'rgba(255,255,255,0.5)',
              padding: 40
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div>Начните диалог первым!</div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isOwn = msg.senderId === currentUserId
            return (
              <div 
                key={`${msg.id}-${idx}`} 
                style={{ 
                  display: 'flex', 
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  paddingLeft: isOwn ? 40 : 0,
                  paddingRight: isOwn ? 0 : 40
                }}
              >
                <div style={{ 
                  maxWidth: '85%', 
                  borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  padding: '10px 14px',
                  background: isOwn 
                    ? 'linear-gradient(135deg, #3390ec, #2b7cd3)' 
                    : 'rgba(255,255,255,0.08)',
                  color: 'white',
                  boxShadow: isOwn 
                    ? '0 4px 12px rgba(51, 144, 236, 0.3)' 
                    : '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                  <p style={{ 
                    margin: 0, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    fontSize: 15,
                    lineHeight: 1.4
                  }}>
                    {msg.content}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end', 
                    alignItems: 'center',
                    gap: 4, 
                    marginTop: 4 
                  }}>
                    <span style={{ 
                      fontSize: 11, 
                      opacity: 0.7 
                    }}>
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOwn && (
                      msg.isRead ? (
                        <CheckCheck size={14} style={{ opacity: 0.9, color: '#90cdf4' }} />
                      ) : (
                        <Check size={14} style={{ opacity: 0.7 }} />
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Индикатор печати */}
          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: '20px 20px 20px 4px',
                padding: '12px 16px',
                display: 'flex',
                gap: 4
              }}>
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.5)',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0s'
                }} />
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.5)',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.2s'
                }} />
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.5)',
                  animation: 'bounce 1.4s infinite ease-in-out both',
                  animationDelay: '0.4s'
                }} />
                <style>{`
                  @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                  }
                `}</style>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Поле ввода - Premium стиль */}
        <div style={{ 
          padding: '12px 16px 32px', // Увеличил отступ снизу до 32px
          background: 'rgba(30, 30, 46, 0.98)', // Чуть менее прозрачный
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.2)' // Тень вверх для разделения
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 10,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 24,
            padding: '8px 8px 8px 16px'
          }}>
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              style={{ 
                flex: 1, 
                background: 'transparent', 
                border: 'none', 
                padding: '8px 0', 
                resize: 'none',
                color: 'white',
                outline: 'none',
                fontSize: 15,
                lineHeight: 1.4,
                maxHeight: 120
              }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              style={{ 
                width: 44,
                height: 44,
                borderRadius: '50%', 
                border: 'none',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                background: message.trim() 
                  ? 'linear-gradient(135deg, #3390ec, #2b7cd3)' 
                  : 'rgba(255,255,255,0.1)',
                color: message.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
                boxShadow: message.trim() ? '0 4px 12px rgba(51, 144, 236, 0.4)' : 'none'
              }}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}

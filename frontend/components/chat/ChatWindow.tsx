'use client'

import { useState, useRef, useEffect, Component, ReactNode } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Безопасное получение данных
  let responseId = ''
  let otherFirstName = 'Пользователь'
  let otherLastName = ''
  let listingTitle = 'Объявление'
  
  try {
    responseId = chat?.responseId ? String(chat.responseId) : ''
    otherFirstName = chat?.otherUser?.firstName ? String(chat.otherUser.firstName) : 'Пользователь'
    otherLastName = chat?.otherUser?.lastName ? String(chat.otherUser.lastName) : ''
    listingTitle = chat?.listingTitle ? String(chat.listingTitle) : 'Объявление'
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
      } catch (e) {
        console.error('Error loading messages:', e)
        if (isMounted) {
          setError('Ошибка загрузки сообщений')
          setLoading(false)
        }
      }
    }

    loadMessages()

    return () => {
      isMounted = false
    }
  }, [responseId])

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
    } catch (e: any) {
      console.error('Send error:', e)
      setMessage(text)
    }
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

  // Показ ошибки
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <p style={{ color: 'red', marginBottom: 16 }}>{error}</p>
        <button onClick={onBack} style={{ color: 'blue', textDecoration: 'underline' }}>
          Назад
        </button>
      </div>
    )
  }

  return (
    <ErrorBoundary onError={() => setError('Произошла ошибка')}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%' }}>
        {/* Заголовок */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderBottom: '1px solid #333', background: '#1e1e1e' }}>
          <button onClick={onBack} style={{ padding: 8, borderRadius: 8, background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <ArrowLeft size={20} />
          </button>
          
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#3390ec', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14 }}>
            {otherFirstName.charAt(0)}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, color: 'white' }}>{otherFirstName} {otherLastName}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{listingTitle}</div>
          </div>
        </div>

        {/* Сообщения */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#888' }}>Загрузка...</div>
          )}
          
          {!loading && messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#888' }}>Нет сообщений</div>
          )}

          {messages.map((msg, idx) => {
            const isOwn = msg.senderId === currentUserId
            return (
              <div key={`${msg.id}-${idx}`} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{ 
                  maxWidth: '75%', 
                  borderRadius: 16, 
                  padding: '8px 16px',
                  background: isOwn ? '#3390ec' : '#2a2a2a',
                  color: 'white'
                }}>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</p>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 11, opacity: 0.7 }}>{formatTime(msg.createdAt)}</span>
                    {isOwn && (
                      <span style={{ fontSize: 11, opacity: 0.7 }}>{msg.isRead ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>

        {/* Ввод */}
        <div style={{ padding: 16, borderTop: '1px solid #333', background: '#1e1e1e' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Сообщение..."
              style={{ 
                flex: 1, 
                background: '#2a2a2a', 
                border: '1px solid #444', 
                borderRadius: 12, 
                padding: '8px 16px', 
                resize: 'none',
                color: 'white',
                outline: 'none'
              }}
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              style={{ 
                padding: 12, 
                borderRadius: 12, 
                border: 'none',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                background: message.trim() ? '#3390ec' : '#444',
                color: message.trim() ? 'white' : '#888'
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

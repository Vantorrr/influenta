'use client'

import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'
import { messagesApi } from '@/lib/api'
import { chatService } from '@/lib/chat.service'

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
  const [isTyping, setIsTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<any>(null)

  // Безопасное получение данных
  const responseId = chat?.responseId || ''
  const otherUser = chat?.otherUser || {}
  const otherFirstName = String(otherUser.firstName || 'Пользователь')
  const otherLastName = String(otherUser.lastName || '')
  const otherPhotoUrl = otherUser.photoUrl || undefined
  const listingTitle = String(chat?.listingTitle || 'Объявление')
  const chatStatus = chat?.status

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
        if (Array.isArray(res)) {
          items = res
        } else if (res && Array.isArray((res as any).data)) {
          items = (res as any).data
        }

        const parsed: Message[] = []
        for (const m of items) {
          if (!m || !m.id) continue
          parsed.push({
            id: String(m.id),
            content: String(m.content || ''),
            senderId: String(m.senderId || ''),
            createdAt: new Date(m.createdAt || Date.now()),
            isRead: Boolean(m.isRead),
          })
        }

        setMessages(parsed.reverse())
        setLoading(false)

        // Отмечаем как прочитанные
        for (const m of parsed) {
          if (!m.isRead && m.senderId !== currentUserId) {
            messagesApi.markAsRead(m.id).catch(() => {})
          }
        }
      } catch (e) {
        if (isMounted) {
          setError('Ошибка загрузки')
          setLoading(false)
        }
      }
    }

    loadMessages()

    // Socket
    try {
      chatService.joinChat(responseId)
    } catch {}

    const onNewMessage = (data: any) => {
      if (!data || data.responseId !== responseId) return
      const msg: Message = {
        id: String(data.id || Date.now()),
        content: String(data.content || ''),
        senderId: String(data.senderId || ''),
        createdAt: new Date(data.createdAt || Date.now()),
        isRead: Boolean(data.isRead),
      }
      setMessages(prev => [...prev, msg])
      if (msg.senderId !== currentUserId) {
        messagesApi.markAsRead(msg.id).catch(() => {})
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
  }, [responseId, currentUserId])

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
        content: String(m.content || text),
        senderId: String(m.senderId || currentUserId),
        createdAt: new Date(m.createdAt || Date.now()),
        isRead: Boolean(m.isRead),
      }
      setMessages(prev => [...prev, newMsg])
      try { chatService.stopTyping(responseId) } catch {}
    } catch (e: any) {
      alert('Не удалось отправить сообщение')
      setMessage(text)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (responseId) {
      try { chatService.startTyping(responseId) } catch {}
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Показ ошибки
  if (error) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center p-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={onBack} className="text-blue-500 underline">
          Назад
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Заголовок */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700/50 bg-telegram-bgSecondary">
        <button onClick={onBack} className="md:hidden p-2 rounded-lg hover:bg-telegram-bg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <Avatar
          firstName={otherFirstName}
          lastName={otherLastName}
          src={otherPhotoUrl}
          size="sm"
        />
        
        <div className="flex-1">
          <h3 className="font-medium flex items-center gap-2">
            {otherFirstName} {otherLastName}
            {chatStatus === 'accepted' && (
              <Badge variant="success" className="text-xs">Сотрудничество</Badge>
            )}
          </h3>
          <p className="text-xs text-telegram-textSecondary">{listingTitle}</p>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="text-center text-telegram-textSecondary">Загрузка...</div>
        )}
        
        {!loading && messages.length === 0 && (
          <div className="text-center text-telegram-textSecondary">Нет сообщений</div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.senderId === currentUserId
          return (
            <div key={`${msg.id}-${idx}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isOwn ? 'bg-telegram-primary text-white' : 'bg-telegram-bgSecondary'
              }`}>
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs opacity-70">{formatTime(msg.createdAt)}</span>
                  {isOwn && (
                    <span className="text-xs opacity-70">{msg.isRead ? '✓✓' : '✓'}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-telegram-bgSecondary rounded-2xl px-4 py-2">
              <span className="text-telegram-textSecondary">печатает...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <div className="p-4 border-t border-gray-700/50 bg-telegram-bgSecondary">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Сообщение..."
            className="flex-1 bg-telegram-bg border border-gray-600 rounded-xl px-4 py-2 resize-none focus:outline-none focus:border-telegram-primary"
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-xl ${
              message.trim()
                ? 'bg-telegram-primary text-white'
                : 'bg-gray-600 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

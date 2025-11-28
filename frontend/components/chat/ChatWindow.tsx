'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Send,
  Info,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime, getRelativeTime } from '@/lib/utils'
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
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<any>(null)

  // Безопасное получение данных пользователя
  const otherUser = chat?.otherUser || {}
  const otherFirstName = String(otherUser.firstName || 'Пользователь')
  const otherLastName = String(otherUser.lastName || '')
  const otherPhotoUrl = otherUser.photoUrl
  const otherRole = otherUser.role
  const otherUserId = otherUser.id
  const listingTitle = String(chat?.listingTitle || 'Объявление')
  const chatStatus = chat?.status
  const responseId = chat?.responseId

  // Загрузка реальных сообщений и подключение к комнате
  useEffect(() => {
    if (!responseId) {
      setError('Не удалось загрузить чат: отсутствует ID')
      return
    }

    let isMounted = true
    const load = async () => {
      try {
        const res = await messagesApi.getByResponse(responseId, 1, 200)
        // Безопасное извлечение массива
        let items: any[] = []
        if (Array.isArray(res)) {
          items = res
        } else if (res && typeof res === 'object') {
          if (Array.isArray((res as any).data)) {
            items = (res as any).data
          } else if (Array.isArray((res as any).items)) {
            items = (res as any).items
          }
        }
        
        if (!isMounted) return
        
        const normalized = items
          .filter((m: any) => m && m.id)
          .map((m: any) => ({
            id: String(m.id),
            content: String(m.content || ''),
            senderId: String(m.senderId || ''),
            createdAt: new Date(m.createdAt || Date.now()),
            isRead: !!m.isRead,
          }))
        setMessages(normalized.reverse())
        setError(null)
        
        // Отметим как прочитанные входящие
        for (const m of normalized) {
          if (!m.isRead && m.senderId !== currentUserId) {
            try { await messagesApi.markAsRead(m.id) } catch {}
          }
        }
      } catch (e) {
        if (isMounted) {
          setMessages([])
          setError('Не удалось загрузить сообщения')
        }
      }
    }
    load()

    // Подключаемся к комнате чата
    try { chatService.joinChat(responseId) } catch {}

    // Слушатель новых сообщений
    const onNewMessage = (data: any) => {
      if (!data || data.responseId !== responseId) return
      const incoming: Message = {
        id: String(data.id || Date.now()),
        content: String(data.content || ''),
        senderId: String(data.senderId || ''),
        createdAt: new Date(data.createdAt || Date.now()),
        isRead: data.isRead ?? (data.senderId === currentUserId),
      }
      setMessages(prev => [...prev, incoming])
      if (incoming.senderId !== currentUserId && !incoming.isRead) {
        try { messagesApi.markAsRead(incoming.id) } catch {}
      }
    }
    const onTyping = (data: any) => {
      if (!data || data.responseId !== responseId || data.userId === currentUserId) return
      setIsTyping(true)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setIsTyping(false), 1500)
    }
    chatService.on('message', onNewMessage)
    chatService.on('typing', onTyping)

    return () => {
      isMounted = false
      try { chatService.leaveChat(responseId) } catch {}
      chatService.off('message', onNewMessage)
      chatService.off('typing', onTyping)
    }
  }, [responseId, currentUserId])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim() || !responseId) return
    const content = message
    setMessage('')
    try {
      console.log('📤 Sending message:', { responseId, content })
      const res = await messagesApi.send(responseId, content)
      console.log('✅ Message sent:', res)
      const m = (res as any)?.data || res || {}
      const newMessage: Message = {
        id: String(m.id || Date.now()),
        content: String(m.content || content),
        senderId: String(m.senderId || currentUserId),
        createdAt: new Date(m.createdAt || Date.now()),
        isRead: !!m.isRead,
      }
      setMessages(prev => [...prev, newMessage])
      try { chatService.stopTyping(responseId) } catch {}
    } catch (e: any) {
      console.error('❌ Message send error:', e)
      alert(`Не удалось отправить: ${e?.response?.data?.message || e?.message || 'Неизвестная ошибка'}`)
      // Возвращаем текст в инпут, если не отправилось
      setMessage(content)
    }
  }

  // Отправляем индикатор набора текста
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (responseId) {
      try { chatService.startTyping(responseId) } catch {}
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => { try { chatService.stopTyping(responseId) } catch {} }, 1000)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getMessageStatus = (msg: Message) => {
    if (msg.senderId !== currentUserId) return null
    
    if (msg.isRead) {
      // Прочитано - две синие галочки
      return (
        <div className="flex -space-x-1">
          <svg className="w-4 h-4 text-telegram-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg className="w-4 h-4 text-telegram-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )
    } else {
      // Отправлено - одна серая галочка
      return (
        <svg className="w-4 h-4 text-telegram-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )
    }
  }

  // Показываем ошибку если есть
  if (error) {
    return (
      <div className="flex flex-col flex-1 h-full items-center justify-center">
        <p className="text-telegram-danger mb-4">{error}</p>
        <button onClick={onBack} className="text-telegram-primary underline">
          Назад к списку
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-telegram-bgSecondary">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-telegram-bg rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <Avatar
            firstName={otherFirstName}
            lastName={otherLastName}
            src={otherPhotoUrl}
            size="sm"
          />
          
          <div onClick={() => { if (otherRole === 'blogger' && otherUserId) { window.location.href = `/bloggers/${otherUserId}` } }} className={otherRole === 'blogger' && otherUserId ? 'cursor-pointer hover:opacity-80 hover:underline' : ''}>
            <h3 className="font-medium flex items-center gap-2">
              {otherFirstName} {otherLastName}
              {chatStatus === 'accepted' && (
                <Badge variant="success" className="text-xs">
                  Сотрудничество
                </Badge>
              )}
            </h3>
            <p className="text-xs text-telegram-textSecondary">
              {listingTitle}
            </p>
          </div>
        </div>
        
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId
            const showAvatar = !isOwn && (
              index === 0 || messages[index - 1]?.senderId !== msg.senderId
            )
            
            return (
              <motion.div
                key={`${msg.id}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <div className="w-8 h-8">
                    {showAvatar && (
                      <Avatar
                        firstName={otherFirstName}
                        lastName={otherLastName}
                        src={otherPhotoUrl}
                        size="sm"
                      />
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-telegram-primary text-white'
                        : 'bg-telegram-bgSecondary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    
                  </div>
                  
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-xs text-telegram-textSecondary">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isOwn && getMessageStatus(msg)}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {/* Индикатор печати */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <Avatar
                firstName={otherFirstName}
                lastName={otherLastName}
                src={otherPhotoUrl}
                size="sm"
              />
              <div className="bg-telegram-bgSecondary rounded-2xl px-4 py-2">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-telegram-textSecondary rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-telegram-textSecondary rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-telegram-textSecondary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-4 pb-2 border-t border-gray-700/50 bg-telegram-bgSecondary">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-telegram-bg border border-gray-600 rounded-lg px-4 py-2 resize-none text-telegram-text placeholder-telegram-textSecondary focus:border-telegram-primary focus:outline-none transition-colors"
            rows={1}
          />
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-lg transition-all ${
              message.trim()
                ? 'bg-telegram-primary text-white hover:bg-telegram-secondary'
                : 'bg-telegram-bgSecondary text-telegram-textSecondary cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

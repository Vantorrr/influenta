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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<any>(null)

  // Загрузка реальных сообщений и подключение к комнате
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await messagesApi.getByResponse(chat.responseId, 1, 200)
        const items = (res as any)?.data || res?.data || []
        if (!isMounted) return
        const normalized = items.map((m: any) => ({
          id: m.id || Math.random().toString(), // Safety fix: ensure ID exists
          content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || ''), // Safety fix: ensure string
          senderId: m.senderId,
          createdAt: new Date(m.createdAt),
          isRead: !!m.isRead,
        }))
        setMessages(normalized.reverse())
        // Отметим как прочитанные входящие
        for (const m of normalized) {
          if (!m.isRead && m.senderId !== currentUserId) {
            try { await messagesApi.markAsRead(m.id) } catch {}
          }
        }
      } catch {
        setMessages([])
      }
    }
    load()

    // Подключаемся к комнате чата
    try { chatService.joinChat(chat.responseId) } catch {}

    // Слушатель новых сообщений
    const onNewMessage = (data: any) => {
      if (data?.responseId !== chat.responseId) return
      const incoming: Message = {
        id: data.id || Date.now().toString(),
        content: typeof data.content === 'object' ? JSON.stringify(data.content) : String(data.content || ''),
        senderId: data.senderId,
        createdAt: new Date(data.createdAt || Date.now()),
        isRead: data.isRead ?? (data.senderId === currentUserId),
      }
      setMessages(prev => [...prev, incoming])
      if (incoming.senderId !== currentUserId && !incoming.isRead) {
        try { messagesApi.markAsRead(incoming.id) } catch {}
      }
    }
    const onTyping = (data: any) => {
      if (data?.responseId !== chat.responseId || data?.userId === currentUserId) return
      setIsTyping(true)
      if (typingTimer.current) clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setIsTyping(false), 1500)
    }
    chatService.on('message', onNewMessage)
    chatService.on('typing', onTyping)

    return () => {
      isMounted = false
      try { chatService.leaveChat(chat.responseId) } catch {}
      chatService.off('message', onNewMessage)
      chatService.off('typing', onTyping)
    }
  }, [chat.responseId, currentUserId])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return
    const content = message
    setMessage('')
    try {
      console.log('📤 Sending message:', { responseId: chat.responseId, content })
      const res = await messagesApi.send(chat.responseId, content)
      console.log('✅ Message sent:', res)
      const m = (res as any)?.data || res
      const newMessage: Message = {
        id: m.id || Date.now().toString(),
        content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || content),
        senderId: m.senderId || currentUserId,
        createdAt: new Date(m.createdAt || Date.now()),
        isRead: !!m.isRead,
      }
      setMessages(prev => [...prev, newMessage])
      try { chatService.stopTyping(chat.responseId) } catch {}
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
    try { chatService.startTyping(chat.responseId) } catch {}
    if (typingTimer.current) clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => { try { chatService.stopTyping(chat.responseId) } catch {} }, 1000)
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
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      )
    } else {
      // Отправлено - одна серая галочка
      return (
        <svg className="w-4 h-4 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#0E1621]">
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-4 border-b border-[#0f1721] bg-[#1c2c3e]/90 backdrop-blur-md shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-[#2b3949] rounded-lg transition-colors text-gray-300"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <Avatar
            firstName={chat.otherUser.firstName}
            lastName={chat.otherUser.lastName}
            src={chat.otherUser.photoUrl}
            size="sm"
          />
          
          <div onClick={() => { if (chat.otherUser?.role === 'blogger' && chat.otherUser?.id) { window.location.href = `/bloggers/${chat.otherUser.id}` } }} className={chat.otherUser?.role === 'blogger' && chat.otherUser?.id ? 'cursor-pointer hover:opacity-80 hover:underline' : ''}>
            <h3 className="font-medium flex items-center gap-2 text-white">
              {chat.otherUser.firstName} {chat.otherUser.lastName}
              {chat.status === 'accepted' && (
                <Badge variant="success" className="text-xs bg-green-500/20 text-green-400 border border-green-500/30">
                  Сотрудничество
                </Badge>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              {chat.listingTitle}
            </p>
          </div>
        </div>
        
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0E1621] relative">
        <div className="absolute inset-0 bg-[url('/bg-pattern.png')] opacity-5 pointer-events-none" />
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId
            const showAvatar = !isOwn && (
              index === 0 || messages[index - 1]?.senderId !== msg.senderId
            )
            
            return (
              <motion.div
                key={`${msg.id}-${index}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 relative z-10 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwn && (
                  <div className="w-8 h-8 flex-shrink-0">
                    {showAvatar && (
                      <Avatar
                        firstName={chat.otherUser.firstName}
                        lastName={chat.otherUser.lastName}
                        src={chat.otherUser.photoUrl}
                        size="sm"
                      />
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      isOwn
                        ? 'bg-gradient-to-br from-[#2AABEE] to-[#229ED9] text-white rounded-tr-sm'
                        : 'bg-[#18222d] border border-[#2b3949] text-white rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                      {typeof msg.content === 'object' ? JSON.stringify(msg.content) : String(msg.content || '')}
                    </p>
                    
                  </div>
                  
                  <div className="flex items-center gap-1.5 px-1 opacity-70">
                    <span className="text-[11px] text-gray-400 font-medium">
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
              className="flex items-center gap-2 relative z-10"
            >
              <Avatar
                firstName={chat.otherUser.firstName}
                lastName={chat.otherUser.lastName}
                src={chat.otherUser.photoUrl}
                size="sm"
              />
              <div className="bg-[#18222d] border border-[#2b3949] rounded-2xl rounded-tl-sm px-4 py-2.5">
                <div className="flex gap-1.5 items-center h-5">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-[#2AABEE] rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-[#2AABEE] rounded-full"
                  />
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-[#2AABEE] rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-4 pb-4 border-t border-[#0f1721] bg-[#1c2c3e]/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-10">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 bg-[#0f1721] rounded-2xl border border-[#2b3949] focus-within:border-[#2AABEE]/50 transition-colors relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Напишите сообщение..."
              className="w-full bg-transparent border-none rounded-2xl px-4 py-3 resize-none text-white placeholder-gray-500 focus:ring-0 focus:outline-none max-h-32 min-h-[46px]"
              rows={1}
              style={{ overflow: 'hidden' }}
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`p-3 rounded-full shadow-lg transition-all flex-shrink-0 ${
              message.trim()
                ? 'bg-gradient-to-r from-[#2AABEE] to-[#229ED9] text-white shadow-[#2AABEE]/20'
                : 'bg-[#18222d] text-gray-500 border border-[#2b3949] cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

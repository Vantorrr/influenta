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
  Check,
  Paperclip
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
        // Handle both paginated response { data: [...] } and direct array response [...]
        const raw = (res as any)?.data || (Array.isArray(res) ? res : [])
        const items = (Array.isArray(raw) ? raw : []).filter((i: any) => i && i.id)
        
        if (!isMounted) return
        const normalized = items.map((m: any) => ({
          id: m.id,
          content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || ''),
          senderId: m.senderId,
          createdAt: new Date(m.createdAt),
          isRead: !!m.isRead,
        }))
        
        // Deduplicate messages by ID to prevent key collisions
        const uniqueMessages = Array.from(new Map(normalized.map((m: any) => [m.id, m])).values())
        
        setMessages((uniqueMessages as Message[]).reverse())
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
        id: data.id,
        content: typeof data.content === 'object' ? JSON.stringify(data.content) : String(data.content || ''),
        senderId: data.senderId,
        createdAt: new Date(data.createdAt || Date.now()),
        isRead: data.isRead ?? (data.senderId === currentUserId),
      }

      setMessages(prev => {
        if (prev.some(m => m.id === incoming.id)) return prev
        return [...prev, incoming]
      })

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
      setMessages(prev => {
        if (prev.some(msg => msg.id === newMessage.id)) return prev
        return [...prev, newMessage]
      })
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
      return <div className="flex -space-x-2">
        <Check className="w-3.5 h-3.5 text-blue-200" />
        <Check className="w-3.5 h-3.5 text-blue-200" />
      </div>
    } else {
      return <Check className="w-3.5 h-3.5 text-blue-200/70" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F10] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none" />

      {/* Заголовок чата */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#1C1E20]/90 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors -ml-2 text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <Avatar
              firstName={chat.otherUser.firstName}
              lastName={chat.otherUser.lastName}
              src={chat.otherUser.photoUrl}
              size="sm"
              className="ring-2 ring-white/10 shadow-xl h-10 w-10"
            />
            {chat.otherUser.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1C1E20] rounded-full ring-1 ring-black/20" />
            )}
          </div>
          
          <div 
            onClick={() => { if (chat.otherUser?.role === 'blogger' && chat.otherUser?.id) { window.location.href = `/bloggers/${chat.otherUser.id}` } }} 
            className={`flex flex-col ${chat.otherUser?.role === 'blogger' && chat.otherUser?.id ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            <h3 className="font-bold text-white flex items-center gap-2 text-base leading-tight">
              {chat.otherUser.firstName} {chat.otherUser.lastName}
              {chat.status === 'accepted' && (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0 h-5 font-medium">
                  Сотрудничество
                </Badge>
              )}
            </h3>
            <p className="text-xs text-white/50 font-medium truncate max-w-[200px]">
              {chat.listingTitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="text-white/50 hover:text-white hover:bg-white/10 p-2 h-10 w-10 rounded-full">
             <Info className="w-6 h-6" />
           </Button>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId
            const showAvatar = !isOwn && (
              index === 0 || messages[index - 1]?.senderId !== msg.senderId
            )
            const isSequential = index > 0 && messages[index - 1]?.senderId === msg.senderId
            
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} ${isSequential ? 'mt-1.5' : 'mt-5'}`}
              >
                {!isOwn && (
                  <div className={`w-8 h-8 flex-shrink-0 flex items-end ${!showAvatar ? 'opacity-0' : ''}`}>
                      <Avatar
                        firstName={chat.otherUser.firstName}
                        lastName={chat.otherUser.lastName}
                        src={chat.otherUser.photoUrl}
                        size="sm"
                      />
                  </div>
                )}
                
                <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`relative px-5 py-3 shadow-md transition-all ${
                      isOwn
                        ? 'bg-gradient-to-tr from-[#3B82F6] to-[#2563EB] text-white rounded-2xl rounded-tr-sm shadow-blue-900/20'
                        : 'bg-[#1F2123] text-white border border-white/5 rounded-2xl rounded-tl-sm shadow-black/20'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed tracking-wide font-light">{msg.content}</p>
                    
                    <div className={`flex items-center gap-1.5 mt-1.5 justify-end select-none ${isOwn ? 'text-blue-100/80' : 'text-white/30'}`}>
                      <span className="text-[10px] font-medium tracking-wide">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwn && getMessageStatus(msg)}
                    </div>
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
              className="flex items-center gap-3 mt-2"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                 <Avatar
                    firstName={chat.otherUser.firstName}
                    lastName={chat.otherUser.lastName}
                    src={chat.otherUser.photoUrl}
                    size="sm"
                  />
              </div>
              <div className="bg-[#1F2123] border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 shadow-md">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-1.5 h-1.5 bg-white/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    className="w-1.5 h-1.5 bg-white/50 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    className="w-1.5 h-1.5 bg-white/50 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Форма ввода - Floating Glass Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pb-8 bg-gradient-to-t from-[#0F0F10] via-[#0F0F10]/95 to-transparent pt-12 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-end gap-3 bg-[#1C1E20] p-2 rounded-[24px] border border-white/10 shadow-2xl shadow-black/50 ring-1 ring-white/5 pointer-events-auto backdrop-blur-2xl">
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 h-11 w-11 shrink-0 rounded-full">
             <Paperclip className="w-5 h-5" />
          </Button>

          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent border-0 px-2 py-3 resize-none text-white placeholder-white/30 focus:ring-0 focus:outline-none max-h-32 min-h-[48px] text-[16px] leading-normal scrollbar-hide"
            rows={1}
            style={{ height: 'auto', minHeight: '48px' }}
            onInput={(e) => {
               const target = e.target as HTMLTextAreaElement;
               target.style.height = 'auto';
               target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all shrink-0 shadow-lg ${
              message.trim()
                ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-500'
                : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5 ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}



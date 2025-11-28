'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Send,
  Info,
  Check,
  CheckCheck,
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
        // Fix for array vs object response
        const raw = (res as any)?.data || res?.data || (Array.isArray(res) ? res : [])
        const items = Array.isArray(raw) ? raw : []
        
        if (!isMounted) return
        const normalized = items.map((m: any) => ({
          id: m.id,
          content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || ''),
          senderId: m.senderId,
          createdAt: new Date(m.createdAt),
          isRead: !!m.isRead,
        }))
        setMessages(normalized.reverse())
        
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

    try { chatService.joinChat(chat.responseId) } catch {}

    const onNewMessage = (data: any) => {
      if (data?.responseId !== chat.responseId) return
      const incoming: Message = {
        id: data.id,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return
    const content = message
    setMessage('')
    try {
      const res = await messagesApi.send(chat.responseId, content)
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
      console.error('Send error', e)
      setMessage(content)
    }
  }

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
      return (
        <div className="flex -space-x-1">
          <CheckCheck className="w-4 h-4 text-blue-400" />
        </div>
      )
    } else {
      return (
        <Check className="w-4 h-4 text-gray-400" />
      )
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#101112]">
      {/* Заголовок чата */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#1C1E20]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <Avatar
            firstName={chat.otherUser.firstName}
            lastName={chat.otherUser.lastName}
            src={chat.otherUser.photoUrl}
            size="sm"
          />
          
          <div className="cursor-pointer hover:opacity-80">
            <h3 className="font-medium text-white flex items-center gap-2">
              {chat.otherUser.firstName} {chat.otherUser.lastName}
              {chat.status === 'accepted' && (
                <Badge variant="default" className="bg-green-500/20 text-green-400 text-xs border-green-500/20">
                  Сотрудничество
                </Badge>
              )}
            </h3>
            <p className="text-xs text-white/50">
              {chat.listingTitle}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
          <Info className="w-5 h-5" />
        </Button>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId
          const showAvatar = !isOwn && (
            index === 0 || messages[index - 1]?.senderId !== msg.senderId
          )
          
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && (
                <div className="w-8 h-8">
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
              
              <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#1C1E20] text-white border border-white/10'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                
                <div className="flex items-center gap-1 mt-1 px-1">
                  <span className="text-xs text-white/40">
                    {formatTime(msg.createdAt)}
                  </span>
                  {isOwn && getMessageStatus(msg)}
                </div>
              </div>
            </div>
          )
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-4 border-t border-white/10 bg-[#1C1E20]">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Напишите сообщение..."
            className="flex-1 bg-[#101112] border border-white/10 rounded-lg px-4 py-2 resize-none text-white placeholder-white/30 focus:border-blue-500 focus:outline-none transition-colors"
            rows={1}
          />
          
          <Button
            onClick={sendMessage}
            disabled={!message.trim()}
            size="sm"
            className={`h-10 w-10 p-0 rounded-lg ${
              message.trim()
                ? 'bg-blue-600 hover:bg-blue-500'
                : 'bg-white/10 text-white/20'
            }`}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

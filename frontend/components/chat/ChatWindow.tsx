'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  ArrowLeft,
  Send,
  CheckCircle,
} from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimer = useRef<any>(null)

  // Robust loading logic
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        const res = await messagesApi.getByResponse(chat.responseId, 1, 50)
        const items = (res as any)?.data || res?.data || (Array.isArray(res) ? res : [])
        
        if (!isMounted) return
        
        // SAFE MAPPING
        const normalized = (Array.isArray(items) ? items : []).map((m: any) => ({
          id: m.id || Math.random().toString(),
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
      } catch (e) {
        console.error('Load error', e)
        setMessages([])
      }
    }
    load()

    try { chatService.joinChat(chat.responseId) } catch {}

    const onNewMessage = (data: any) => {
      if (data?.responseId !== chat.responseId) return
      const incoming: Message = {
        id: data.id || Date.now().toString(),
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
      alert(`Ошибка: ${e?.message || 'Не удалось отправить'}`)
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
          <svg className="w-4 h-4 text-telegram-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg className="w-4 h-4 text-telegram-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      )
    }
    return (
      <svg className="w-4 h-4 text-telegram-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-telegram-bgSecondary">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-telegram-bg rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Avatar firstName={chat.otherUser.firstName} lastName={chat.otherUser.lastName} src={chat.otherUser.photoUrl} size="sm" />
          <div onClick={() => { if (chat.otherUser?.role === 'blogger' && chat.otherUser?.id) { window.location.href = `/bloggers/${chat.otherUser.id}` } }} className={chat.otherUser?.role === 'blogger' && chat.otherUser?.id ? 'cursor-pointer hover:opacity-80 hover:underline' : ''}>
            <h3 className="font-medium flex items-center gap-2">
              {chat.otherUser.firstName} {chat.otherUser.lastName}
              {chat.status === 'accepted' && <Badge variant="success" className="text-xs">Сотрудничество</Badge>}
            </h3>
            <p className="text-xs text-telegram-textSecondary">{chat.listingTitle}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId
          const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== msg.senderId)
          
          return (
            <div key={`${msg.id}-${index}`} className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && (
                <div className="w-8 h-8">
                  {showAvatar && <Avatar firstName={chat.otherUser.firstName} lastName={chat.otherUser.lastName} src={chat.otherUser.photoUrl} size="sm" />}
                </div>
              )}
              <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-4 py-2 ${isOwn ? 'bg-telegram-primary text-white' : 'bg-telegram-bgSecondary'}`}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-telegram-textSecondary">{formatTime(msg.createdAt)}</span>
                  {isOwn && getMessageStatus(msg)}
                </div>
              </div>
            </div>
          )
        })}
        
        {isTyping && (
          <div className="flex items-center gap-2 animate-pulse">
             <Avatar firstName={chat.otherUser.firstName} lastName={chat.otherUser.lastName} src={chat.otherUser.photoUrl} size="sm" />
             <div className="bg-telegram-bgSecondary rounded-2xl px-4 py-2 text-xs text-telegram-textSecondary">
                Печатает...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`p-2 rounded-lg transition-all ${message.trim() ? 'bg-telegram-primary text-white hover:bg-telegram-secondary' : 'bg-telegram-bgSecondary text-telegram-textSecondary cursor-not-allowed'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

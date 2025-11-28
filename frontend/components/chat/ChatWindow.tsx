'use client'
// Premium Chat UI
import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime } from '@/lib/utils'
import { messagesApi } from '@/lib/api'
import { chatService } from '@/lib/chat.service'

// Simple SVG Icons to prevent Lucide crash and ensure lightweight rendering
const IconArrowLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
const IconInfo = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
const IconSend = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
const IconPaperclip = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
const IconCheck = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>

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
        // Normalize data structure to handle potentially varying API responses
        const raw = (res as any)?.data || res?.data || (Array.isArray(res) ? res : [])
        const items = Array.isArray(raw) ? raw : []
        
        if (!isMounted) return
        
        const normalized = items.map((m: any) => ({
          id: m.id,
          // Safety check: ensure content is string
          content: typeof m.content === 'object' ? JSON.stringify(m.content) : String(m.content || ''),
          senderId: m.senderId,
          createdAt: new Date(m.createdAt),
          isRead: !!m.isRead,
        }))
        // Backend returns newest first usually, so reverse for chat view (oldest at top)
        setMessages(normalized.reverse())
        
        // Mark unread messages from others as read
        for (const m of normalized) {
          if (!m.isRead && m.senderId !== currentUserId) {
            try { await messagesApi.markAsRead(m.id) } catch {}
          }
        }
      } catch (err) {
        console.error('Failed to load messages', err)
        setMessages([])
      }
    }
    load()

    // Socket connection
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
      setMessages(prev => [...prev, incoming]) // Append new message
      
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async () => {
    if (!message.trim()) return
    const content = message
    setMessage('') // Optimistic clear
    
    // Reset textarea height
    if (inputRef.current) {
        inputRef.current.style.height = 'auto';
    }

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
      alert(`Ошибка: ${e?.message || 'Не удалось отправить сообщение'}`)
      setMessage(content) // Restore on error
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`; // Max 128px

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
      return <div className="flex -space-x-2 text-blue-200"><IconCheck /><IconCheck /></div>
    }
    return <div className="text-blue-200/70"><IconCheck /></div>
  }

  return (
    <div className="flex flex-col h-full bg-[#0F0F10] relative overflow-hidden">
      {/* Premium Glass Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#1C1E20]/80 backdrop-blur-md sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 hover:bg-white/10 rounded-full text-white transition-colors">
            <IconArrowLeft />
          </button>
          <div className="relative">
            <Avatar 
              firstName={chat.otherUser?.firstName} 
              lastName={chat.otherUser?.lastName} 
              src={chat.otherUser?.photoUrl} 
              size="sm" 
              className="ring-2 ring-white/10 shadow-md"
            />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1C1E20]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-[15px] leading-tight">
              {chat.otherUser?.firstName} {chat.otherUser?.lastName}
            </h3>
            <p className="text-xs text-white/40 truncate max-w-[180px]">
              {chat.listingTitle}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-white/40 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
          <IconInfo />
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-32 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-white/10">
        {messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUserId
          const showAvatar = !isOwn && (index === 0 || messages[index - 1]?.senderId !== msg.senderId)

          return (
            <div key={msg.id || index} className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'} group`}>
              {!isOwn && (
                <div className="w-8 h-8 flex-shrink-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity">
                   {showAvatar && <Avatar firstName={chat.otherUser?.firstName} src={chat.otherUser?.photoUrl} size="sm" />}
                </div>
              )}
              
              <div className={`max-w-[85%] md:max-w-[65%] px-4 py-2.5 shadow-sm ${
                isOwn 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-blue-700' 
                  : 'bg-[#1F2123] text-white border border-white/5 rounded-2xl rounded-tl-sm'
              }`}>
                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
                <div className={`flex items-center gap-1 justify-end text-[10px] mt-1 ${isOwn ? 'text-blue-200' : 'text-white/30'}`}>
                  {formatTime(msg.createdAt)}
                  {isOwn && <div className="w-3.5 h-3.5 scale-75">{getMessageStatus(msg)}</div>}
                </div>
              </div>
            </div>
          )
        })}
        {isTyping && (
           <div className="flex gap-3 justify-start ml-11">
              <div className="bg-[#1F2123] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                 <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                 <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                 <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
           </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Floating Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-40 p-4 pb-6 bg-gradient-to-t from-[#0F0F10] via-[#0F0F10] to-transparent pt-20">
        <div className="max-w-4xl mx-auto flex items-end gap-2 bg-[#1C1E20] p-1.5 pr-2 rounded-[24px] border border-white/10 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white h-10 w-10 rounded-full p-0 shrink-0 hover:bg-white/5 transition-colors">
             <IconPaperclip />
          </Button>
          
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Сообщение..."
            className="flex-1 bg-transparent border-0 px-2 py-2.5 text-white placeholder-white/30 focus:ring-0 focus:outline-none max-h-32 min-h-[44px] resize-none text-[15px]"
            rows={1}
          />
          
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
              message.trim() 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:scale-105 active:scale-95' 
                : 'bg-white/5 text-white/10'
            }`}
          >
            <div className="p-2.5"><IconSend /></div>
          </button>
        </div>
      </div>
    </div>
  )
}

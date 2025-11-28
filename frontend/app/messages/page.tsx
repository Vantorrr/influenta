'use client'

import { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  MessageSquare,
  CheckCircle,
  X,
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getRelativeTime } from '@/lib/utils'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { messagesApi } from '@/lib/api'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface Chat {
  id: string
  responseId: string
  listingTitle: string
  otherUser: {
    id?: string
    firstName: string
    lastName: string
    username: string
    photoUrl?: string
    role: 'blogger' | 'advertiser'
  }
  lastMessage: {
    content: string
    createdAt: Date
    isRead: boolean
    senderId: string
  }
  unreadCount: number
  status: 'active' | 'accepted' | 'rejected'
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="container h-[calc(100vh-8rem)] flex items-center justify-center text-white/40">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p>Загрузка сообщений...</p>
          </div>
        </div>
      </Layout>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}

function MessagesPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const currentUserId = user?.id || ''

  // Загрузка реального списка чатов
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await messagesApi.getChatList()
        const rows = (res as any)?.data || res
        const normalized: Chat[] = (rows || []).map((row: any) => {
          // Определяем, кто я: блогер (автор отклика) или рекламодатель (владелец объявления)
          const iAmBlogger = user.role === 'blogger'
          const otherUserData = iAmBlogger
            ? row.response?.listing?.advertiser?.user // Я блогер → собеседник рекламодатель
            : row.response?.blogger?.user // Я рекламодатель → собеседник блогер
          
          return {
            id: row.responseId,
            responseId: row.responseId,
            listingTitle: row.response?.listing?.title || 'Объявление',
            otherUser: {
              id: otherUserData?.id,
              firstName: otherUserData?.firstName || 'Пользователь',
              lastName: otherUserData?.lastName || '',
              username: otherUserData?.username || '',
              photoUrl: otherUserData?.photoUrl,
              role: iAmBlogger ? 'advertiser' : 'blogger',
            },
            lastMessage: row.lastMessage ? {
              content: row.lastMessage.content,
              createdAt: new Date(row.lastMessage.createdAt),
              isRead: !!row.lastMessage.isRead,
              senderId: row.lastMessage.senderId,
            } : {
              content: 'Нет сообщений',
              createdAt: new Date(),
              isRead: true,
              senderId: '',
            },
            unreadCount: row.unreadCount || 0,
            status: 'active',
          }
        })
        // Убираем дубликаты чатов (оставляем один чат на одного пользователя)
        // Если с одним пользователем несколько чатов (по разным объявлениям), показываем последний
        const uniqueChats = Array.from(new Map(normalized.map(item => [item.otherUser.id, item])).values())
        setChats(uniqueChats)
      } catch {
        setChats([])
      }
    })()
  }, [user])

  // Маркируем как прочитанные при открытии чата
  useEffect(() => {
    (async () => {
      if (!selectedChat) return
      try {
        const res = await messagesApi.getByResponse(selectedChat.responseId, 1, 50)
        const items = (res as any)?.data || res?.data || []
        for (const m of items) {
          if (!m.isRead && m.senderId !== currentUserId) {
            try { await messagesApi.markAsRead(m.id) } catch {}
          }
        }
      } catch {}
    })()
  }, [selectedChat, currentUserId])

  // Автовыбор чата по responseId в query
  useEffect(() => {
    const rid = searchParams?.get('responseId')
    if (rid && chats.length > 0) {
      const found = chats.find(c => c.responseId === rid)
      if (found) setSelectedChat(found)
    }
  }, [searchParams, chats])

  const filteredChats = chats.filter(chat => {
    const searchLower = search.toLowerCase()
    return (
      chat.listingTitle.toLowerCase().includes(searchLower) ||
      chat.otherUser.firstName.toLowerCase().includes(searchLower) ||
      chat.otherUser.lastName.toLowerCase().includes(searchLower) ||
      chat.otherUser.username.toLowerCase().includes(searchLower)
    )
  })

  const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0)

  return (
    <Layout>
      <div className="h-[calc(100vh-5rem)] flex bg-[#101112] overflow-hidden rounded-t-2xl border-t border-white/5">
        {/* Список чатов */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[400px] border-r border-white/5 bg-[#1C1E20]/30 backdrop-blur-sm relative z-10`}>
          {/* Поиск */}
          <div className="p-4 space-y-4 border-b border-white/5 bg-[#1C1E20]/80 backdrop-blur-md">
            <div className="flex items-center justify-between px-1">
              <h1 className="text-2xl font-bold text-white">Сообщения</h1>
              {totalUnread > 0 && (
                <Badge variant="default" className="bg-blue-500 text-white hover:bg-blue-600 border-none">
                  {totalUnread} новых
                </Badge>
              )}
            </div>
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-blue-500 transition-colors" />
              <Input
                type="search"
                placeholder="Поиск сообщений..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#101112] border-white/10 focus:border-blue-500/50 h-11 rounded-xl text-white placeholder-white/30 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
            {filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-3 rounded-xl transition-all border border-transparent group relative overflow-hidden ${
                    selectedChat?.id === chat.id 
                      ? 'bg-blue-600/10 border-blue-500/20 shadow-lg shadow-blue-500/5' 
                      : 'hover:bg-white/5 hover:border-white/5'
                  }`}
                >
                  {selectedChat?.id === chat.id && (
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                  )}
                  
                  <div className="flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <Avatar
                        firstName={chat.otherUser.firstName}
                        lastName={chat.otherUser.lastName}
                        src={chat.otherUser.photoUrl}
                        size="md"
                        className={`ring-2 ${selectedChat?.id === chat.id ? 'ring-blue-500/30' : 'ring-white/5'} shadow-lg`}
                      />
                    </div>
                    
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`font-semibold text-sm truncate flex items-center gap-1.5 ${selectedChat?.id === chat.id ? 'text-blue-100' : 'text-white'}`}>
                          {chat.otherUser.firstName} {chat.otherUser.lastName}
                          {chat.status === 'accepted' && (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          )}
                        </h3>
                        <span className={`text-[11px] font-medium shrink-0 ${selectedChat?.id === chat.id ? 'text-blue-200/70' : 'text-white/30'}`}>
                          {getRelativeTime(chat.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-white/40 truncate mb-1.5">
                        {chat.listingTitle}
                      </p>
                      
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate leading-snug ${selectedChat?.id === chat.id ? 'text-blue-100/80' : 'text-white/60'}`}>
                          <span className={chat.lastMessage.senderId === currentUserId ? 'text-white/30' : ''}>
                            {chat.lastMessage.senderId === currentUserId && 'Вы: '}
                          </span>
                          {chat.lastMessage.content}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="default" className="bg-blue-500 text-white hover:bg-blue-600 h-5 px-1.5 min-w-[1.25rem] justify-center text-[10px] border-none shadow-lg shadow-blue-500/20 animate-pulse">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
            
            {filteredChats.length === 0 && (
              <div className="text-center py-12 px-4">
                 <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SearchIcon className="w-8 h-8 text-white/20" />
                 </div>
                 <p className="text-white/40 text-sm">Ничего не найдено</p>
              </div>
            )}
          </div>
        </div>

        {/* Окно чата */}
        <div className={`flex-1 flex flex-col h-full bg-[#101112] relative overflow-hidden ${!selectedChat ? 'hidden md:flex' : ''}`}>
          {/* Background Decor */}
          <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-5 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />

          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              currentUserId={currentUserId}
              onBack={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm">
                <div className="w-24 h-24 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/10 border border-white/5 relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                   <MessageSquare className="w-10 h-10 text-blue-400 relative z-10" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Ваши сообщения</h3>
                <p className="text-white/40 leading-relaxed">
                  Выберите чат слева, чтобы продолжить общение, или найдите новое задание для обсуждения.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

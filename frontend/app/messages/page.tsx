'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search as SearchIcon, 
  MessageSquare,
  CheckCircle,
  Clock,
  X,
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate, getRelativeTime } from '@/lib/utils'
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
        <div className="container h-[calc(100vh-8rem)] flex items-center justify-center text-telegram-textSecondary">
          Загрузка сообщений...
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

  const ensureArray = (value: any): any[] => {
    if (Array.isArray(value)) return value
    if (Array.isArray(value?.items)) return value.items
    if (Array.isArray(value?.data)) return value.data
    return []
  }

  const normalizeContent = (value: any): string => {
    if (typeof value === 'string') return value
    if (value == null) return ''
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  // Загрузка реального списка чатов
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await messagesApi.getChatList()
        const rawRows = (res as any)?.data ?? res
        const rows = ensureArray(rawRows)
        const normalized: Chat[] = rows.map((row: any) => {
          // Определяем, кто я: блогер (автор отклика) или рекламодатель (владелец объявления)
          const iAmBlogger = user.role === 'blogger'
          const otherUserData = iAmBlogger
            ? row.response?.listing?.advertiser?.user // Я блогер → собеседник рекламодатель
            : row.response?.blogger?.user // Я рекламодатель → собеседник блогер
          
          const lastMessageData = row.lastMessage || null
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
            lastMessage: lastMessageData ? {
              content: normalizeContent(lastMessageData.content),
              createdAt: lastMessageData.createdAt ? new Date(lastMessageData.createdAt) : new Date(),
              isRead: !!lastMessageData.isRead,
              senderId: lastMessageData.senderId,
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
        setChats(normalized)
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
        const rawItems = (res as any)?.data ?? res
        const items = ensureArray(rawItems)
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
      <div className="h-[calc(100vh-4rem)] flex -mb-16">
        {/* Список чатов */}
        <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-700/50`}>
          {/* Поиск */}
          <div className="p-4 border-b border-gray-700/50">
            <Input
              type="search"
              placeholder="Поиск сообщений..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<SearchIcon className="w-4 h-4" />}
            />
            {totalUnread > 0 && (
              <p className="text-sm text-telegram-textSecondary mt-2">
                Непрочитанных: {totalUnread}
              </p>
            )}
          </div>

          {/* Список чатов */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 hover:bg-telegram-bgSecondary transition-colors border-b border-gray-700/50 ${
                    selectedChat?.id === chat.id ? 'bg-telegram-bgSecondary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      firstName={chat.otherUser.firstName}
                      lastName={chat.otherUser.lastName}
                      src={chat.otherUser.photoUrl}
                      size="md"
                    />
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {chat.otherUser.firstName} {chat.otherUser.lastName}
                            {chat.status === 'accepted' && (
                              <CheckCircle className="w-4 h-4 text-telegram-success" />
                            )}
                            {chat.status === 'rejected' && (
                              <X className="w-4 h-4 text-telegram-danger" />
                            )}
                          </h3>
                          <p className="text-xs text-telegram-textSecondary">
                            {chat.listingTitle}
                          </p>
                          {chat.otherUser.role === "blogger" && chat.otherUser.id && (
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); window.location.href = `/bloggers/${chat.otherUser.id}` }} className="px-0 text-telegram-primary">
                              Открыть профиль блогера
                            </Button>
                          )}
                        </div>
                        <span className="text-xs text-telegram-textSecondary">
                          {getRelativeTime(chat.lastMessage.createdAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-telegram-textSecondary line-clamp-1">
                          {chat.lastMessage.senderId === currentUserId && 'Вы: '}
                          {chat.lastMessage.content}
                        </p>
                        {chat.unreadCount > 0 && (
                          <Badge variant="primary" className="ml-2">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Окно чата */}
        {selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            currentUserId={currentUserId}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-telegram-textSecondary mx-auto mb-4" />
              <p className="text-telegram-textSecondary">
                Выберите чат для начала общения
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}










'use client'

import { useState } from 'react'
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
import { Layout } from '@/components/layout/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { formatDate, getRelativeTime } from '@/lib/utils'
import { ChatWindow } from '@/components/chat/ChatWindow'

interface Chat {
  id: string
  responseId: string
  listingTitle: string
  otherUser: {
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
  const [search, setSearch] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const currentUserId = '1' // Mock current user

  // Mock данные чатов
  const chats: Chat[] = [
    {
      id: '1',
      responseId: '1',
      listingTitle: 'Реклама мобильного приложения',
      otherUser: {
        firstName: 'Анна',
        lastName: 'Иванова',
        username: '@anna_lifestyle',
        role: 'blogger',
      },
      lastMessage: {
        content: 'Отлично! Готова начать работу над постом. Когда нужно опубликовать?',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        isRead: false,
        senderId: '2',
      },
      unreadCount: 2,
      status: 'accepted',
    },
    {
      id: '2',
      responseId: '2',
      listingTitle: 'Продвижение онлайн-курса',
      otherUser: {
        firstName: 'TechBrand',
        lastName: '',
        username: '@techbrand',
        role: 'advertiser',
      },
      lastMessage: {
        content: 'Спасибо за отклик! Можете показать примеры похожих работ?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        isRead: true,
        senderId: '3',
      },
      unreadCount: 0,
      status: 'active',
    },
    {
      id: '3',
      responseId: '3',
      listingTitle: 'Реклама косметики',
      otherUser: {
        firstName: 'BeautyWorld',
        lastName: '',
        username: '@beautyworld',
        role: 'advertiser',
      },
      lastMessage: {
        content: 'К сожалению, мы выбрали другого блогера. Спасибо за интерес!',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isRead: true,
        senderId: '4',
      },
      unreadCount: 0,
      status: 'rejected',
    },
  ]

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
      <div className="container h-[calc(100vh-8rem)] flex">
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



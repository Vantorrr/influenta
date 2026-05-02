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

type ChatType = 'response' | 'offer'

interface Chat {
  /** Уникальный ключ в списке (responseId для response-чата, chatId для offer-чата) */
  id: string
  type: ChatType
  /** Используется только для response-чатов (listing→отклик). Для offer-чата = null. */
  responseId: string | null
  /** Используется только для offer-чатов (UUID записи в таблице chats). Для response-чата = null. */
  chatId: string | null
  /** Title для отображения (листинг или название проекта) */
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
  proposal?: {
    message: string
    proposedPrice: number
    listingBudget: number
  }
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container h-[calc(100vh-8rem)] flex items-center justify-center text-telegram-textSecondary">
            Загрузка сообщений...
          </div>
        </Layout>
      }
    >
      <MessagesPageContent />
    </Suspense>
  )
}

function normalizeText(raw: any): string {
  if (raw === undefined || raw === null) return ''
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw)
    } catch {
      return ''
    }
  }
  return String(raw)
}

function MessagesPageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [error, setError] = useState<string | null>(null)
  const currentUserId = user?.id || ''

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const res = await messagesApi.getChatList()

        let rows: any[] = []
        if (Array.isArray(res)) {
          rows = res
        } else if (res && typeof res === 'object') {
          if (Array.isArray((res as any).data)) rows = (res as any).data
          else if (Array.isArray((res as any).items)) rows = (res as any).items
        }

        const normalized: Chat[] = []
        for (const row of rows) {
          if (!row) continue
          const rowType: ChatType =
            row.type === 'offer' || row.offerId ? 'offer' : row.type === 'response' || row.responseId ? 'response' : 'response'

          if (rowType === 'response' && row.responseId) {
            const iAmBlogger = user.role === 'blogger'
            const otherUserData = iAmBlogger
              ? row.response?.listing?.advertiser?.user
              : row.response?.blogger?.user

            const rawLastContent = row.lastMessage?.content ?? row.lastMessage?.text
            const lastContent = rawLastContent ? normalizeText(rawLastContent) : 'Нет сообщений'

            normalized.push({
              id: `response:${String(row.responseId)}`,
              type: 'response',
              responseId: String(row.responseId),
              chatId: null,
              listingTitle: normalizeText(row.response?.listing?.title) || 'Объявление',
              otherUser: {
                id: otherUserData?.id ? String(otherUserData.id) : undefined,
                firstName: normalizeText(otherUserData?.firstName) || 'Пользователь',
                lastName: normalizeText(otherUserData?.lastName),
                username: normalizeText(otherUserData?.username),
                photoUrl: otherUserData?.photoUrl,
                role: iAmBlogger ? 'advertiser' : 'blogger',
              },
              lastMessage: row.lastMessage
                ? {
                    content: lastContent,
                    createdAt: new Date(row.lastMessage.createdAt || Date.now()),
                    isRead: !!row.lastMessage.isRead,
                    senderId: String(row.lastMessage.userId || row.lastMessage.senderId || ''),
                  }
                : {
                    content: 'Нет сообщений',
                    createdAt: new Date(),
                    isRead: true,
                    senderId: '',
                  },
              unreadCount: Number(row.unreadCount) || 0,
              status: 'active',
              proposal: row.response
                ? {
                    message: normalizeText(row.response.message),
                    proposedPrice: Number(row.response.proposedPrice) || 0,
                    listingBudget: Number(row.response.listing?.budget) || 0,
                  }
                : undefined,
            })
            continue
          }

          if (rowType === 'offer' && (row.chatId || row.offerId)) {
            const offer = row.offer || {}
            const iAmAdvertiser =
              offer?.advertiser?.userId === user.id ||
              row.chat?.advertiserId === user.id
            const otherUserData = iAmAdvertiser
              ? offer?.blogger
              : offer?.advertiser?.user

            const rawLastContent = row.lastMessage?.content ?? row.lastMessage?.text
            const lastContent = rawLastContent ? normalizeText(rawLastContent) : 'Нет сообщений'

            const chatId = row.chatId ? String(row.chatId) : row.chat?.id ? String(row.chat.id) : ''

            normalized.push({
              id: `offer:${chatId || row.offerId}`,
              type: 'offer',
              responseId: null,
              chatId: chatId || null,
              listingTitle: normalizeText(offer?.projectTitle) || 'Коллаборация',
              otherUser: {
                id: otherUserData?.id ? String(otherUserData.id) : undefined,
                firstName: normalizeText(otherUserData?.firstName) || 'Пользователь',
                lastName: normalizeText(otherUserData?.lastName),
                username: normalizeText(otherUserData?.username),
                photoUrl: otherUserData?.photoUrl,
                role: iAmAdvertiser ? 'blogger' : 'advertiser',
              },
              lastMessage: row.lastMessage
                ? {
                    content: lastContent,
                    createdAt: new Date(row.lastMessage.createdAt || Date.now()),
                    isRead: !!row.lastMessage.isRead,
                    senderId: String(row.lastMessage.senderId || row.lastMessage.userId || ''),
                  }
                : {
                    content: 'Нет сообщений',
                    createdAt: new Date(),
                    isRead: true,
                    senderId: '',
                  },
              unreadCount: Number(row.unreadCount) || 0,
              status: 'accepted',
              proposal: offer
                ? {
                    message: normalizeText(offer.message),
                    proposedPrice: Number(offer.proposedBudget) || 0,
                    listingBudget: Number(offer.proposedBudget) || 0,
                  }
                : undefined,
            })
          }
        }

        setChats(normalized)
        setError(null)
      } catch (e) {
        console.error('Failed to load chats:', e)
        setChats([])
        setError('Не удалось загрузить список чатов')
      }
    })()
  }, [user])

  // Авто-выбор чата по query. Поддерживаем оба параметра.
  useEffect(() => {
    if (!chats.length) return
    const chatId = searchParams?.get('chatId')
    const responseId = searchParams?.get('responseId')
    if (chatId) {
      const found = chats.find((c) => c.type === 'offer' && c.chatId === chatId)
      if (found) {
        setSelectedChat(found)
        return
      }
    }
    if (responseId) {
      const found = chats.find((c) => c.type === 'response' && c.responseId === responseId)
      if (found) setSelectedChat(found)
    }
  }, [searchParams, chats])

  const filteredChats = chats.filter((chat) => {
    const searchLower = search.toLowerCase()
    return (
      (chat.listingTitle || '').toLowerCase().includes(searchLower) ||
      (chat.otherUser?.firstName || '').toLowerCase().includes(searchLower) ||
      (chat.otherUser?.lastName || '').toLowerCase().includes(searchLower) ||
      (chat.otherUser?.username || '').toLowerCase().includes(searchLower)
    )
  })

  const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)

  return (
    <Layout>
      <div className="h-[calc(100vh-4rem)] flex">
        <div
          className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-700/50`}
        >
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

          {error && (
            <div className="p-4 text-center text-telegram-danger">{error}</div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredChats.length === 0 && !error && (
              <div className="p-4 text-center text-telegram-textSecondary">
                {chats.length === 0 ? 'Нет активных чатов' : 'Ничего не найдено'}
              </div>
            )}
            {filteredChats.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <button
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full p-4 hover:bg-telegram-bgSecondary transition-colors border-b border-gray-700/50 ${
                    selectedChat?.id === chat.id ? 'bg-telegram-bgSecondary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      firstName={chat.otherUser?.firstName || 'П'}
                      lastName={chat.otherUser?.lastName || ''}
                      src={chat.otherUser?.photoUrl}
                      size="md"
                    />

                    <div className="flex-1 text-left">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {chat.otherUser?.firstName || 'Пользователь'}{' '}
                            {chat.otherUser?.lastName || ''}
                            {chat.status === 'accepted' && (
                              <CheckCircle className="w-4 h-4 text-telegram-success" />
                            )}
                            {chat.status === 'rejected' && (
                              <X className="w-4 h-4 text-telegram-danger" />
                            )}
                          </h3>
                          <p className="text-xs text-telegram-textSecondary">
                            {chat.listingTitle || 'Объявление'}
                          </p>
                          {chat.otherUser?.role === 'blogger' && chat.otherUser?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `/bloggers/${chat.otherUser.id}`
                              }}
                              className="px-0 text-telegram-primary"
                            >
                              Открыть профиль блогера
                            </Button>
                          )}
                        </div>
                        <span className="text-xs text-telegram-textSecondary">
                          {chat.lastMessage?.createdAt
                            ? getRelativeTime(chat.lastMessage.createdAt)
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-sm text-telegram-textSecondary line-clamp-1">
                          {chat.lastMessage?.senderId === currentUserId && 'Вы: '}
                          {chat.lastMessage?.content || 'Нет сообщений'}
                        </p>
                        {(chat.unreadCount || 0) > 0 && (
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

        {selectedChat ? (
          <ChatWindow
            chat={{
              type: selectedChat.type,
              responseId: selectedChat.responseId || undefined,
              chatId: selectedChat.chatId || undefined,
              listingTitle: selectedChat.listingTitle,
              otherUser: selectedChat.otherUser,
              status: selectedChat.status,
              proposal: selectedChat.proposal,
            }}
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

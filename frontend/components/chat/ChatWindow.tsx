'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  Send,
  Paperclip,
  Image as ImageIcon,
  MoreVertical,
  Phone,
  Video,
  Info,
  CheckCircle,
  Clock,
  X,
  File,
  Link as LinkIcon
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatTime, getRelativeTime } from '@/lib/utils'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: Date
  isRead: boolean
  attachments?: Array<{
    type: 'image' | 'document' | 'link'
    url: string
    name?: string
    size?: number
  }>
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
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Mock сообщения
  useEffect(() => {
    setMessages([
      {
        id: '1',
        content: 'Здравствуйте! Заинтересовало ваше предложение о рекламе.',
        senderId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        isRead: true,
      },
      {
        id: '2',
        content: 'Добрый день! Отлично, давайте обсудим детали. Какой у вас охват аудитории?',
        senderId: currentUserId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
        isRead: true,
      },
      {
        id: '3',
        content: 'У меня 125К подписчиков, средний охват постов около 45К просмотров. В основном женская аудитория 18-35 лет.',
        senderId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 22),
        isRead: true,
      },
      {
        id: '4',
        content: 'Отлично подходит под нашу ЦА! Можете показать примеры интеграций?',
        senderId: currentUserId,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
        isRead: true,
      },
      {
        id: '5',
        content: 'Конечно, вот несколько последних работ:',
        senderId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 19),
        isRead: true,
        attachments: [
          { type: 'image', url: '/example1.jpg', name: 'Пример поста 1' },
          { type: 'image', url: '/example2.jpg', name: 'Пример поста 2' },
        ],
      },
      {
        id: '6',
        content: 'Отличная подача! Давайте работать вместе. Готовы начать?',
        senderId: currentUserId,
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        isRead: true,
      },
      {
        id: '7',
        content: 'Отлично! Готова начать работу над постом. Когда нужно опубликовать?',
        senderId: '2',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        isRead: false,
      },
    ])
  }, [currentUserId])

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim()) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: message,
      senderId: currentUserId,
      createdAt: new Date(),
      isRead: false,
    }

    setMessages([...messages, newMessage])
    setMessage('')
    
    // Имитация ответа
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      // Можно добавить автоответ
    }, 2000)
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
      return <CheckCircle className="w-4 h-4 text-telegram-primary" />
    } else {
      return <Clock className="w-4 h-4 text-telegram-textSecondary" />
    }
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
            firstName={chat.otherUser.firstName}
            lastName={chat.otherUser.lastName}
            src={chat.otherUser.photoUrl}
            size="sm"
          />
          
          <div>
            <h3 className="font-medium flex items-center gap-2">
              {chat.otherUser.firstName} {chat.otherUser.lastName}
              {chat.status === 'accepted' && (
                <Badge variant="success" className="text-xs">
                  Сотрудничество
                </Badge>
              )}
            </h3>
            <p className="text-xs text-telegram-textSecondary">
              {chat.listingTitle}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
          >
            <Phone className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
          >
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
          >
            <Info className="w-5 h-5" />
          </motion.button>
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
                key={msg.id}
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
                        firstName={chat.otherUser.firstName}
                        lastName={chat.otherUser.lastName}
                        src={chat.otherUser.photoUrl}
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
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-2">
                        {msg.attachments.map((attachment, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {attachment.type === 'image' ? (
                              <div className="relative">
                                <div className="w-48 h-32 bg-telegram-bg rounded-lg flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-telegram-textSecondary" />
                                </div>
                                <p className="text-xs mt-1">{attachment.name}</p>
                              </div>
                            ) : attachment.type === 'document' ? (
                              <div className="flex items-center gap-2 p-2 bg-telegram-bg/50 rounded-lg">
                                <File className="w-5 h-5" />
                                <span className="text-sm">{attachment.name}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-telegram-bg/50 rounded-lg">
                                <LinkIcon className="w-5 h-5" />
                                <span className="text-sm">{attachment.url}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                firstName={chat.otherUser.firstName}
                lastName={chat.otherUser.lastName}
                src={chat.otherUser.photoUrl}
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
      <div className="p-4 border-t border-gray-700/50 bg-telegram-bgSecondary">
        <div className="flex items-end gap-2">
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="p-2 hover:bg-telegram-bg rounded-lg transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>
            
            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-telegram-bgSecondary rounded-lg shadow-lg p-2"
                >
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-telegram-bg rounded-lg transition-colors w-full">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm">Фото</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-telegram-bg rounded-lg transition-colors w-full">
                    <File className="w-4 h-4" />
                    <span className="text-sm">Файл</span>
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 hover:bg-telegram-bg rounded-lg transition-colors w-full">
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-sm">Ссылка</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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

// Helper function
function formatTime(date: Date): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  
  if (isToday) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }
  
  return date.toLocaleDateString('ru-RU', { 
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}



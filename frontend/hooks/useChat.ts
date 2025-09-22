import { useState, useEffect, useCallback } from 'react'
import { chatService } from '@/lib/chat.service'
import { messagesApi } from '@/lib/api'
import type { Message } from '@/types'

interface UseChat {
  messages: Message[]
  isLoading: boolean
  isTyping: boolean
  typingUser: string | null
  sendMessage: (content: string, attachments?: any[]) => void
  loadMoreMessages: () => void
  markAsRead: (messageId: string) => void
  startTyping: () => void
  stopTyping: () => void
}

export function useChat(responseId: string): UseChat {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Загрузка сообщений
  useEffect(() => {
    loadMessages()
  }, [responseId])

  // Подключение к WebSocket
  useEffect(() => {
    // Присоединяемся к чату
    chatService.joinChat(responseId)

    // Подписываемся на события
    const handleNewMessage = (message: Message) => {
      if (message.responseId === responseId) {
        setMessages(prev => [...prev, message])
      }
    }

    const handleTyping = ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      if (isTyping) {
        setTypingUser(userId)
      } else {
        setTypingUser(null)
      }
    }

    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      )
    }

    chatService.on('message', handleNewMessage)
    chatService.on('typing', handleTyping)
    chatService.on('messageRead', handleMessageRead)

    // Отписываемся при размонтировании
    return () => {
      chatService.leaveChat(responseId)
      chatService.off('message', handleNewMessage)
      chatService.off('typing', handleTyping)
      chatService.off('messageRead', handleMessageRead)
    }
  }, [responseId])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      const response = await messagesApi.getByResponse(responseId, page)
      
      if (page === 1) {
        setMessages(response.data.reverse())
      } else {
        setMessages(prev => [...response.data.reverse(), ...prev])
      }
      
      setHasMore(response.hasMore)
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1)
    }
  }, [hasMore, isLoading])

  const sendMessage = useCallback(async (content: string, attachments?: any[]) => {
    try {
      const response = await messagesApi.send(responseId, content, attachments)
      
      // Сообщение будет добавлено через WebSocket
      chatService.sendMessage(responseId, content, attachments)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }, [responseId])

  const markAsRead = useCallback((messageId: string) => {
    messagesApi.markAsRead(messageId)
    chatService.markAsRead(messageId)
  }, [])

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      chatService.startTyping(responseId)
    }
  }, [responseId, isTyping])

  const stopTyping = useCallback(() => {
    if (isTyping) {
      setIsTyping(false)
      chatService.stopTyping(responseId)
    }
  }, [responseId, isTyping])

  return {
    messages,
    isLoading,
    isTyping: !!typingUser,
    typingUser,
    sendMessage,
    loadMoreMessages,
    markAsRead,
    startTyping,
    stopTyping,
  }
}



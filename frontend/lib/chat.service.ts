import { io, Socket } from 'socket.io-client'

class ChatService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()

  connect(token: string) {
    if (this.socket?.connected) return

    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    this.socket.on('connect', () => {
      console.log('Connected to chat server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server')
    })

    // Обработка входящих сообщений
    this.socket.on('message', (data) => {
      this.emit('message', data)
    })

    // Индикатор печати
    this.socket.on('typing', (data) => {
      this.emit('typing', data)
    })

    // Статус прочтения
    this.socket.on('messageRead', (data) => {
      this.emit('messageRead', data)
    })

    // Новый чат
    this.socket.on('newChat', (data) => {
      this.emit('newChat', data)
    })
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  // Отправка сообщения
  sendMessage(responseId: string, content: string, attachments?: any[]) {
    if (!this.socket?.connected) return

    this.socket.emit('sendMessage', {
      responseId,
      content,
      attachments,
    })
  }

  // Присоединение к чату
  joinChat(responseId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('joinChat', { responseId })
  }

  // Покинуть чат
  leaveChat(responseId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('leaveChat', { responseId })
  }

  // Индикатор печати
  startTyping(responseId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('startTyping', { responseId })
  }

  stopTyping(responseId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('stopTyping', { responseId })
  }

  // Пометить как прочитанное
  markAsRead(messageId: string) {
    if (!this.socket?.connected) return

    this.socket.emit('markAsRead', { messageId })
  }

  // Подписка на события
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)?.push(callback)
  }

  // Отписка от событий
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // Эмит события
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }
}

export const chatService = new ChatService()



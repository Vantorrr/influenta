import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../common/guards/ws-jwt.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string[]>();

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      if (userId) {
        // Сохраняем соединение пользователя
        const sockets = this.userSockets.get(userId) || [];
        sockets.push(client.id);
        this.userSockets.set(userId, sockets);

        console.log(`User ${userId} connected with socket ${client.id}`);
      }
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId) || [];
      const index = sockets.indexOf(client.id);
      if (index > -1) {
        sockets.splice(index, 1);
      }
      
      if (sockets.length === 0) {
        this.userSockets.delete(userId);
      } else {
        this.userSockets.set(userId, sockets);
      }

      console.log(`User ${userId} disconnected socket ${client.id}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { responseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`chat:${data.responseId}`);
    return { event: 'joined', data: { responseId: data.responseId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { responseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`chat:${data.responseId}`);
    return { event: 'left', data: { responseId: data.responseId } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { responseId: string; content: string; attachments?: any[] },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    // Сохраняем сообщение в БД
    const message = await this.chatService.createMessage({
      responseId: data.responseId,
      senderId: userId,
      content: data.content,
      attachments: data.attachments,
    });

    // Отправляем сообщение всем участникам чата
    this.server.to(`chat:${data.responseId}`).emit('message', message);

    return { event: 'messageSent', data: message };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('startTyping')
  async handleStartTyping(
    @MessageBody() data: { responseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    // Уведомляем других участников чата
    client.to(`chat:${data.responseId}`).emit('typing', {
      userId,
      isTyping: true,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @MessageBody() data: { responseId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    // Уведомляем других участников чата
    client.to(`chat:${data.responseId}`).emit('typing', {
      userId,
      isTyping: false,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.auth.userId;
    
    // Обновляем статус в БД
    const message = await this.chatService.markAsRead(data.messageId, userId);
    
    if (message) {
      // Уведомляем отправителя
      const senderSockets = this.userSockets.get(message.senderId) || [];
      senderSockets.forEach(socketId => {
        this.server.to(socketId).emit('messageRead', {
          messageId: data.messageId,
        });
      });
    }
  }

  // Метод для отправки уведомлений конкретному пользователю
  sendToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId) || [];
    sockets.forEach(socketId => {
      this.server.to(socketId).emit(event, data);
    });
  }
}


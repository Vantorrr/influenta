import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // ─── Response-chats (listing → отклик) ────────────────────────────
  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, payload: { responseId: string }) {
    client.join(`chat-${payload.responseId}`);
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(client: Socket, payload: { responseId: string }) {
    client.leave(`chat-${payload.responseId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(client: Socket, payload: any) {
    try {
      const message = await this.chatService.createMessage(payload);
      this.server.to(`chat-${payload.responseId}`).emit('message', message);
      return { success: true, data: message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('startTyping')
  handleStartTyping(client: Socket, payload: { responseId: string }) {
    client.to(`chat-${payload.responseId}`).emit('typing', {
      responseId: payload.responseId,
      userId: (client as any).user?.id,
    });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(client: Socket, payload: { responseId: string }) {
    client.to(`chat-${payload.responseId}`).emit('stopTyping', {
      responseId: payload.responseId,
      userId: (client as any).user?.id,
    });
  }

  // ─── Offer-chats (JSONB chats.messages) ───────────────────────────
  @SubscribeMessage('joinOfferChat')
  handleJoinOfferChat(client: Socket, payload: { chatId: string }) {
    if (payload?.chatId) client.join(`offer-chat-${payload.chatId}`);
  }

  @SubscribeMessage('leaveOfferChat')
  handleLeaveOfferChat(client: Socket, payload: { chatId: string }) {
    if (payload?.chatId) client.leave(`offer-chat-${payload.chatId}`);
  }

  /** Внутренний метод: вызывается ChatService после appendUserMessage, чтобы пробросить событие в комнату. */
  broadcastOfferMessage(chatId: string, message: any) {
    try {
      this.server.to(`offer-chat-${chatId}`).emit('offerMessage', message);
    } catch {
      // ignore
    }
  }
}

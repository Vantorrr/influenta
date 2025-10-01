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

  @SubscribeMessage('joinChat')
  handleJoinChat(client: Socket, payload: { responseId: string }) {
    client.join(`chat-${payload.responseId}`);
    console.log(`Client ${client.id} joined chat-${payload.responseId}`);
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
    client.to(`chat-${payload.responseId}`).emit('typing', { userId: (client as any).user?.id });
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(client: Socket, payload: { responseId: string }) {
    client.to(`chat-${payload.responseId}`).emit('stopTyping', { userId: (client as any).user?.id });
  }
}


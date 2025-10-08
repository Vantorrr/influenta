import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('list')
  @ApiOperation({ summary: 'Get chat list for current user' })
  async getChatList(@CurrentUser() user: any) {
    return this.chatService.getChatList(user.id);
  }

  @Get('messages/:responseId')
  @ApiOperation({ summary: 'Get messages for a response' })
  async getMessages(
    @Param('responseId') responseId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getMessages(responseId, page, limit);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() data: {
      responseId: string;
      content: string;
      attachments?: any[];
    },
  ) {
    try {
      const message = await this.chatService.createMessage({
        ...data,
        senderId: user.id,
      });
      return { success: true, data: message };
    } catch (error) {
      console.error('Error creating message:', error);
      return { success: false, message: error?.message || 'Failed to send message' };
    }
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(
    @CurrentUser() user: any,
    @Param('id') messageId: string,
  ) {
    return this.chatService.markAsRead(messageId, user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread messages count' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.chatService.getUnreadCount(user.id);
    return { count };
  }
}

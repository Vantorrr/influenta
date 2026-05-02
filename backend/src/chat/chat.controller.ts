import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get chat list for current user (response + offer chats)' })
  async getChatList(@CurrentUser() user: any) {
    return this.chatService.getChatList(user.id);
  }

  // ─── Response-chats (taблица messages) ─────────────────────────────

  @Get('messages/:responseId')
  @ApiOperation({ summary: 'Get messages for a response-chat' })
  async getMessages(
    @Param('responseId') responseId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.chatService.getMessages(responseId, Number(page), Number(limit));
  }

  @Post('messages')
  @ApiOperation({ summary: 'Send a message into a response-chat' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body()
    data: {
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
      return {
        success: false,
        message: error?.message || 'Failed to send message',
      };
    }
  }

  @Post('messages/:id/read')
  @ApiOperation({ summary: 'Mark response-chat message as read' })
  async markAsRead(@CurrentUser() user: any, @Param('id') messageId: string) {
    return this.chatService.markAsRead(messageId, user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread messages count (response + offer)' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.chatService.getUnreadCount(user.id);
    return { count };
  }

  // ─── Offer-chats (JSONB chats.messages) ────────────────────────────

  @Post('ensure-for-offer/:offerId')
  @ApiOperation({
    summary: 'Idempotently create (or find) chat for an accepted offer',
  })
  async ensureForOffer(
    @Param('offerId') offerId: string,
    @CurrentUser() user: any,
  ) {
    const chat = await this.chatService.ensureChatForOfferId(offerId, user.id);
    return { chatId: chat.id };
  }

  @Get('by-id/:chatId')
  @ApiOperation({ summary: 'Get offer-chat by id (with messages)' })
  async getChatById(
    @Param('chatId') chatId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getChatByIdForUser(chatId, user.id);
  }

  @Post('by-id/:chatId/messages')
  @ApiOperation({ summary: 'Send message into an offer-chat' })
  async sendToChat(
    @Param('chatId') chatId: string,
    @Body() data: { content: string },
    @CurrentUser() user: any,
  ) {
    const result = await this.chatService.appendUserMessage(
      chatId,
      user.id,
      data?.content || '',
    );
    return { success: true, data: result.message };
  }

  @Post('by-id/:chatId/read')
  @ApiOperation({ summary: 'Mark all unread messages in offer-chat as read' })
  async markOfferChatRead(
    @Param('chatId') chatId: string,
    @CurrentUser() user: any,
  ) {
    await this.chatService.markOfferChatAsRead(chatId, user.id);
    return { success: true };
  }
}

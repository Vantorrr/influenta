import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('messages/send')
  async send(
    @Body() data: { chatId: string; text: string },
    @CurrentUser() user: User,
  ) {
    return this.messagesService.sendMessage(user.id, data.chatId, data.text);
  }

  // Совместимость с фронтом: используем responseId как chatId
  @Post('chat/messages')
  async sendByResponse(
    @Body() data: { responseId: string; content: string },
    @CurrentUser() user: User,
  ) {
    return this.messagesService.sendMessage(user.id, data.responseId, data.content);
  }

  @Get('chat/messages/:responseId')
  async getByResponse(
    @Param('responseId') responseId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.messagesService.getByChat(responseId, Number(page), Number(limit));
  }

  @Post('chat/messages/:id/read')
  async markRead(@Param('id') id: string) {
    return this.messagesService.markAsRead(id);
  }
}










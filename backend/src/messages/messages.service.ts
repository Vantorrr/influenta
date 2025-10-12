import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async createChat(userId1: string, userId2: string, title?: string) {
    // В реальном приложении здесь будет логика создания чата
    // Пока просто возвращаем объект с id
    return { id: `chat-${userId1}-${userId2}`, title };
  }

  async sendMessage(userId: string, chatId: string, text: string) {
    // В реальном приложении здесь будет логика отправки сообщения
    const message = this.messagesRepository.create({
      userId,
      chatId,
      text,
    });
    return this.messagesRepository.save(message);
  }
}







import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Chat } from '@/chat/entities/chat.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
  ) {}

  async createChat(userId1: string, userId2: string, title?: string, offerId?: string): Promise<Chat> {
    // Проверяем, есть ли уже чат для этого оффера
    if (offerId) {
      const existingChat = await this.chatRepository.findOne({
        where: { offerId },
      });
      if (existingChat) {
        return existingChat;
      }
    }

    // Создаём новый чат
    const chatData: Partial<Chat> = {
      advertiser: { id: userId1 } as any, // Отправитель
      blogger: { id: userId2 } as any,    // Получатель
      messages: [],
      unreadCount: 0,
    };
    
    if (offerId) {
      chatData.offerId = offerId;
    }

    const chat = this.chatRepository.create(chatData);
    const savedChat = await this.chatRepository.save(chat);
    
    // save возвращает один объект, когда передан один объект
    return Array.isArray(savedChat) ? savedChat[0] : savedChat;
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

  async getByChat(chatId: string, page = 1, limit = 50) {
    const [data, total] = await this.messagesRepository.findAndCount({
      where: { chatId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async markAsRead(id: string) {
    await this.messagesRepository.update({ id }, { isRead: true });
    return this.messagesRepository.findOne({ where: { id } });
  }
}










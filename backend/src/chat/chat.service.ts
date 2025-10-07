import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Message } from './entities/message.entity';
import { Response } from '../responses/entities/response.entity';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Response)
    private responseRepository: Repository<Response>,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  async createMessage(data: {
    responseId: string;
    senderId: string;
    content: string;
    attachments?: any[];
  }) {
    const message = this.messageRepository.create({
      responseId: data.responseId,
      senderId: data.senderId,
      content: data.content,
      attachments: data.attachments || [],
    });

    const saved = await this.messageRepository.save(message);

    // Отправляем уведомление получателю
    try {
      const response = await this.responseRepository.findOne({
        where: { id: data.responseId },
        relations: ['blogger', 'blogger.user', 'listing', 'listing.advertiser', 'listing.advertiser.user'],
      });
      if (response) {
        const iAmBlogger = (response as any)?.blogger?.userId === data.senderId;
        const recipientUser = iAmBlogger
          ? (response as any)?.listing?.advertiser?.user
          : (response as any)?.blogger?.user;
        
        if (recipientUser?.telegramId) {
          const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app';
          const messageText = `💬 <b>Новое сообщение</b>\n\n${data.content.slice(0, 100)}${data.content.length > 100 ? '...' : ''}`;
          await this.telegramService.sendMessage(parseInt(String(recipientUser.telegramId), 10), messageText, {
            inline_keyboard: [[{ text: 'Открыть чат', web_app: { url: `${frontendUrl}/messages?responseId=${data.responseId}` } }]],
          });
        }
      }
    } catch (err) {
      console.error('Failed to send chat notification:', err);
    }

    return saved;
  }

  async getMessages(responseId: string, page = 1, limit = 50) {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: { responseId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
      relations: ['sender'],
    });

    return {
      data: messages,
      total,
      page,
      limit,
      hasMore: total > page * limit,
    };
  }

  async markAsRead(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['response'],
    });

    if (!message) return null;

    // Проверяем, что пользователь является получателем
    const response = await this.responseRepository.findOne({
      where: { id: message.responseId },
      relations: ['blogger', 'listing'],
    });

    if (!response) return null;

    // Помечаем как прочитанное
    message.isRead = true;
    message.readAt = new Date();
    
    return await this.messageRepository.save(message);
  }

  async getUnreadCount(userId: string) {
    // Получаем все отклики пользователя
    const responses = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoin('response.blogger', 'blogger')
      .leftJoin('response.listing', 'listing')
      .where('blogger.userId = :userId OR listing.advertiserId = :userId', { userId })
      .getMany();

    const responseIds = responses.map(r => r.id);

    if (responseIds.length === 0) return 0;

    // Считаем непрочитанные сообщения
    const count = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.responseId IN (:...responseIds)', { responseIds })
      .andWhere('message.senderId != :userId', { userId })
      .andWhere('message.isRead = false')
      .getCount();

    return count;
  }

  async getChatList(userId: string) {
    // Получаем все отклики пользователя
    const responses = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.blogger', 'blogger')
      .leftJoinAndSelect('response.listing', 'listing')
      .leftJoinAndSelect('listing.advertiser', 'advertiser')
      .leftJoinAndSelect('blogger.user', 'bloggerUser')
      .leftJoinAndSelect('advertiser.user', 'advertiserUser')
      .where('blogger.userId = :userId OR advertiser.userId = :userId', { userId })
      .getMany();

    // Для каждого отклика получаем последнее сообщение
    const chats = await Promise.all(
      responses.map(async (response) => {
        const lastMessage = await this.messageRepository.findOne({
          where: { responseId: response.id },
          order: { createdAt: 'DESC' },
          relations: ['sender'],
        });

        const unreadCount = await this.messageRepository.count({
          where: {
            responseId: response.id,
            senderId: Not(userId),
            isRead: false,
          },
        });

        return {
          responseId: response.id,
          response,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // Сортируем по дате последнего сообщения
    return chats.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime();
    });
  }
}










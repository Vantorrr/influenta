import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { randomUUID } from 'crypto';
import { Message } from './entities/message.entity';
import { Response } from '../responses/entities/response.entity';
import { Chat } from './entities/chat.entity';
import { Offer, OfferStatus } from '../offers/entities/offer.entity';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

export interface ChatInlineMessage {
  id: string;
  content: string;
  senderId: string;
  createdAt: Date | string;
  isRead: boolean;
  type?: 'system' | 'user';
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Response)
    private responseRepository: Repository<Response>,
    @InjectRepository(Chat)
    private chatRepository: Repository<Chat>,
    @InjectRepository(Offer)
    private offerRepository: Repository<Offer>,
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // RESPONSE-CHAT (listing → отклик блогера): хранение в таблице messages
  // ─────────────────────────────────────────────────────────────────

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

    try {
      const response = await this.responseRepository.findOne({
        where: { id: data.responseId },
        relations: [
          'blogger',
          'blogger.user',
          'listing',
          'listing.advertiser',
          'listing.advertiser.user',
        ],
      });
      if (response) {
        const iAmBlogger = (response as any)?.blogger?.userId === data.senderId;
        const recipientUser = iAmBlogger
          ? (response as any)?.listing?.advertiser?.user
          : (response as any)?.blogger?.user;

        if (recipientUser?.telegramId) {
          const frontendUrl =
            this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app';
          const messageText = `💬 <b>Новое сообщение</b>\n\n${data.content.slice(0, 100)}${data.content.length > 100 ? '...' : ''}`;
          await this.telegramService.sendMessage(
            parseInt(String(recipientUser.telegramId), 10),
            messageText,
            {
              inline_keyboard: [
                [
                  {
                    text: 'Открыть чат',
                    web_app: {
                      url: `${frontendUrl}/messages?responseId=${data.responseId}`,
                    },
                  },
                ],
              ],
            },
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to send chat notification for responseId=${data.responseId}: ${err?.message}`,
      );
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

  async markAsRead(messageId: string, _userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['response'],
    });

    if (!message) return null;

    const response = await this.responseRepository.findOne({
      where: { id: message.responseId },
      relations: ['blogger', 'listing'],
    });

    if (!response) return null;

    message.isRead = true;
    message.readAt = new Date();

    return await this.messageRepository.save(message);
  }

  async getUnreadCount(userId: string) {
    const responses = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoin('response.blogger', 'blogger')
      .leftJoin('response.listing', 'listing')
      .where('blogger.userId = :userId OR listing.advertiserId = :userId', { userId })
      .getMany();

    const responseIds = responses.map((r) => r.id);

    // Непрочитанные из response-чатов (таблица messages)
    let responseUnread = 0;
    if (responseIds.length > 0) {
      responseUnread = await this.messageRepository
        .createQueryBuilder('message')
        .where('message.responseId IN (:...responseIds)', { responseIds })
        .andWhere('message.senderId != :userId', { userId })
        .andWhere('message.isRead = false')
        .getCount();
    }

    // Непрочитанные из offer-чатов (JSONB chats.messages)
    const offerChats = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.offerId IS NOT NULL')
      .andWhere('(chat.bloggerId = :userId OR chat.advertiserId = :userId)', { userId })
      .getMany();

    const offerUnread = offerChats.reduce((sum, chat) => {
      const list: ChatInlineMessage[] = (chat.messages as any) || [];
      return (
        sum +
        list.filter((m) => m && m.senderId !== userId && m.senderId !== 'system' && !m.isRead).length
      );
    }, 0);

    return responseUnread + offerUnread;
  }

  // ─────────────────────────────────────────────────────────────────
  // OFFER-CHAT (рекламодатель → блогер): хранение в chats.messages JSONB
  // ─────────────────────────────────────────────────────────────────

  /**
   * Идемпотентно возвращает (или создаёт) чат для принятого оффера.
   * Безопасно при гонке: при конфликте повторно читает существующую запись.
   */
  async ensureChatForOffer(offer: Offer): Promise<Chat> {
    const advertiserUserId = offer.advertiser?.userId;
    const bloggerUserId = offer.blogger?.id;

    if (!offer.id) {
      throw new BadRequestException('Offer id is missing');
    }
    if (!advertiserUserId || !bloggerUserId) {
      throw new BadRequestException('Offer participants are missing');
    }

    const existing = await this.chatRepository.findOne({ where: { offerId: offer.id } });
    if (existing) return existing;

    try {
      const chat = this.chatRepository.create({
        offerId: offer.id,
        advertiserId: advertiserUserId,
        bloggerId: bloggerUserId,
        messages: [],
        unreadCount: 0,
      });
      const saved = await this.chatRepository.save(chat);
      this.logger.log(
        `Chat created for offer=${offer.id} advertiser=${advertiserUserId} blogger=${bloggerUserId}`,
      );
      return saved;
    } catch (err) {
      // Гонка: кто-то создал чат параллельно.
      const retry = await this.chatRepository.findOne({ where: { offerId: offer.id } });
      if (retry) return retry;
      this.logger.error(
        `ensureChatForOffer failed for offer=${offer.id}: ${err?.message}`,
      );
      throw err;
    }
  }

  async appendSystemMessage(chat: Chat, content: string): Promise<Chat> {
    const msg: ChatInlineMessage = {
      id: randomUUID(),
      content,
      senderId: 'system',
      createdAt: new Date(),
      isRead: false,
      type: 'system',
    };
    chat.messages = [...((chat.messages as any) || []), msg];
    return this.chatRepository.save(chat);
  }

  async getChatByIdForUser(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: [
        'blogger',
        'advertiser',
        'offer',
        'offer.advertiser',
        'offer.advertiser.user',
        'offer.blogger',
      ],
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.bloggerId !== userId && chat.advertiserId !== userId) {
      throw new ForbiddenException('Нет доступа к этому чату');
    }
    return chat;
  }

  async appendUserMessage(
    chatId: string,
    senderId: string,
    content: string,
  ): Promise<{ chat: Chat; message: ChatInlineMessage }> {
    if (!content || !content.trim()) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }
    const chat = await this.getChatByIdForUser(chatId, senderId);

    const msg: ChatInlineMessage = {
      id: randomUUID(),
      content: content.trim(),
      senderId,
      createdAt: new Date(),
      isRead: false,
      type: 'user',
    };
    chat.messages = [...((chat.messages as any) || []), msg];
    const saved = await this.chatRepository.save(chat);

    // Telegram уведомление собеседнику с deep-link'ом на offer-chat
    try {
      const recipientUserId =
        chat.advertiserId === senderId ? chat.bloggerId : chat.advertiserId;
      if (recipientUserId) {
        const recipient = await this.chatRepository
          .createQueryBuilder('c')
          .leftJoinAndSelect('c.blogger', 'blogger')
          .leftJoinAndSelect('c.advertiser', 'advertiser')
          .where('c.id = :id', { id: chat.id })
          .getOne();
        const recipientUser =
          chat.advertiserId === senderId ? recipient?.blogger : recipient?.advertiser;
        if (recipientUser?.telegramId) {
          const frontendUrl =
            this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app';
          const preview = msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '');
          await this.telegramService.sendMessage(
            parseInt(String(recipientUser.telegramId), 10),
            `💬 <b>Новое сообщение</b>\n\n${preview}`,
            {
              inline_keyboard: [
                [
                  {
                    text: 'Открыть чат',
                    web_app: { url: `${frontendUrl}/messages?chatId=${chat.id}` },
                  },
                ],
              ],
            },
          );
        }
      }
    } catch (err) {
      this.logger.warn(
        `Failed to notify offer chat recipient chatId=${chat.id}: ${err?.message}`,
      );
    }

    return { chat: saved, message: msg };
  }

  async markOfferChatAsRead(chatId: string, userId: string): Promise<Chat> {
    const chat = await this.getChatByIdForUser(chatId, userId);
    const list: ChatInlineMessage[] = (chat.messages as any) || [];
    let changed = false;
    for (const m of list) {
      if (m && !m.isRead && m.senderId !== userId) {
        m.isRead = true;
        changed = true;
      }
    }
    if (changed) {
      chat.messages = list as any;
      return this.chatRepository.save(chat);
    }
    return chat;
  }

  /**
   * Идемпотентно находит оффер, проверяет что user — участник и оффер ACCEPTED,
   * возвращает (или создаёт) чат. Используется и фронтом при клике "Перейти в чат",
   * и в self-heal ветке getChatList.
   */
  async ensureChatForOfferId(offerId: string, userId: string): Promise<Chat> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['advertiser', 'advertiser.user', 'blogger'],
    });
    if (!offer) throw new NotFoundException('Оффер не найден');

    const isAdvertiser = offer.advertiser?.userId === userId;
    const isBlogger = offer.blogger?.id === userId;
    if (!isAdvertiser && !isBlogger) {
      throw new ForbiddenException('Нет доступа к этому офферу');
    }
    if (offer.status !== OfferStatus.ACCEPTED) {
      throw new BadRequestException('Чат доступен только для принятых предложений');
    }

    return this.ensureChatForOffer(offer);
  }

  // ─────────────────────────────────────────────────────────────────
  // СПИСОК ЧАТОВ: response-chats + offer-chats (с self-heal)
  // ─────────────────────────────────────────────────────────────────

  async getChatList(userId: string) {
    // 1. Response-based чаты (listing → отклик)
    const responses = await this.responseRepository
      .createQueryBuilder('response')
      .leftJoinAndSelect('response.blogger', 'blogger')
      .leftJoinAndSelect('response.listing', 'listing')
      .leftJoinAndSelect('listing.advertiser', 'advertiser')
      .leftJoinAndSelect('blogger.user', 'bloggerUser')
      .leftJoinAndSelect('advertiser.user', 'advertiserUser')
      .where('blogger.userId = :userId OR advertiser.userId = :userId', { userId })
      .getMany();

    const responseChats = await Promise.all(
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
          type: 'response' as const,
          responseId: response.id,
          response,
          lastMessage,
          unreadCount,
        };
      }),
    );

    // 2. Self-heal: для каждого ACCEPTED оффера без записи в chats создаём её.
    try {
      const acceptedOffers = await this.offerRepository
        .createQueryBuilder('offer')
        .leftJoinAndSelect('offer.advertiser', 'advertiser')
        .leftJoinAndSelect('advertiser.user', 'advertiserUser')
        .leftJoinAndSelect('offer.blogger', 'blogger')
        .where('offer.status = :status', { status: OfferStatus.ACCEPTED })
        .andWhere('(advertiser.userId = :userId OR offer.bloggerId = :userId)', { userId })
        .getMany();

      if (acceptedOffers.length > 0) {
        const offerIds = acceptedOffers.map((o) => o.id);
        const existingChats = await this.chatRepository.find({
          where: { offerId: In(offerIds) },
        });
        const existingSet = new Set(existingChats.map((c) => c.offerId));
        const toCreate = acceptedOffers.filter((o) => !existingSet.has(o.id));
        for (const offer of toCreate) {
          try {
            await this.ensureChatForOffer(offer);
          } catch (e) {
            this.logger.warn(
              `Self-heal: could not ensure chat for offerId=${offer.id}: ${e?.message}`,
            );
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Self-heal for offer chats failed: ${err?.message}`);
    }

    // 3. Offer-based чаты (после self-heal читаем с полным набором связей)
    let offerChats: any[] = [];
    try {
      const offerChatsRaw = await this.chatRepository
        .createQueryBuilder('chat')
        .leftJoinAndSelect('chat.blogger', 'blogger')
        .leftJoinAndSelect('chat.advertiser', 'advertiser')
        .leftJoinAndSelect('chat.offer', 'offer')
        .leftJoinAndSelect('offer.advertiser', 'offerAdv')
        .leftJoinAndSelect('offerAdv.user', 'offerAdvUser')
        .leftJoinAndSelect('offer.blogger', 'offerBlogger')
        .where('chat.offerId IS NOT NULL')
        .andWhere('(chat.bloggerId = :userId OR chat.advertiserId = :userId)', { userId })
        .getMany();

      offerChats = offerChatsRaw.map((chat) => {
        const messagesList: ChatInlineMessage[] = (chat.messages as any) || [];
        const lastMessage = messagesList.length > 0 ? messagesList[messagesList.length - 1] : null;

        const unreadCount = messagesList.filter(
          (m: any) => m && m.senderId !== userId && m.senderId !== 'system' && !m.isRead,
        ).length;

        return {
          type: 'offer' as const,
          chatId: chat.id,
          offerId: chat.offerId,
          offer: chat.offer,
          chat,
          lastMessage,
          unreadCount,
        };
      });
    } catch (error) {
      this.logger.error(`Error fetching offer chats: ${error?.message}`);
    }

    const allChats = [...responseChats, ...offerChats];

    return allChats.sort((a: any, b: any) => {
      const dateA = new Date(
        a.lastMessage?.createdAt || a.chat?.createdAt || (a.response as any)?.createdAt || 0,
      ).getTime();
      const dateB = new Date(
        b.lastMessage?.createdAt || b.chat?.createdAt || (b.response as any)?.createdAt || 0,
      ).getTime();
      return dateB - dateA;
    });
  }
}

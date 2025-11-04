import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { User } from '@/users/entities/user.entity';
import { TelegramService } from '@/telegram/telegram.service';
import { MessagesService } from '@/messages/messages.service';
import { BloggersService } from '@/bloggers/bloggers.service';
import { AdvertisersService } from '@/advertisers/advertisers.service';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private telegramService: TelegramService,
    private messagesService: MessagesService,
    private bloggersService: BloggersService,
    private advertisersService: AdvertisersService,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User) {
    // Проверяем что пользователь - рекламодатель
    if (user.role !== 'advertiser') {
      throw new BadRequestException('Только рекламодатели могут отправлять предложения');
    }

    // Получаем рекламодателя
    const advertiser = await this.advertisersService.findOrCreateByUserId(user.id);
    if (!advertiser) {
      throw new BadRequestException('Профиль рекламодателя не найден');
    }

    // Проверяем существование блогера
    const targetUser = await this.bloggersService.getUserById(createOfferDto.bloggerId);
    if (!targetUser || targetUser.role !== 'blogger') {
      throw new NotFoundException('Блогер не найден');
    }
    
    // Создаем виртуальный объект blogger для совместимости
    const blogger = {
      id: createOfferDto.bloggerId,
      userId: createOfferDto.bloggerId,
      user: targetUser,
    };

    // Проверяем, нет ли уже активного предложения
    const existingOffer = await this.offersRepository.findOne({
      where: {
        advertiserId: advertiser.id,
        bloggerId: createOfferDto.bloggerId,
        status: OfferStatus.PENDING,
      },
    });

    if (existingOffer) {
      throw new BadRequestException('У вас уже есть активное предложение этому блогеру');
    }

    // Создаем предложение
    const offer = this.offersRepository.create({
      ...createOfferDto,
      advertiserId: advertiser.id,
      status: OfferStatus.PENDING,
    });

    const savedOffer = await this.offersRepository.save(offer);

    // Отправляем уведомление блогеру в Telegram
    const bloggerUser = blogger.user as any;
    const telegramChatId = bloggerUser?.telegramId || bloggerUser?.id;
    console.log('🔍 Sending offer notification to blogger:', {
      bloggerId: blogger.id,
      userId: bloggerUser?.id,
      telegramId: bloggerUser?.telegramId,
      firstName: bloggerUser?.firstName,
      lastName: bloggerUser?.lastName,
    });

    if (telegramChatId) {
      try {
        const budgetNumber = Number(createOfferDto.proposedBudget) || 0;
        const budgetFormatted = new Intl.NumberFormat('ru-RU').format(budgetNumber);
        const message = `🎯 <b>Новое предложение о сотрудничестве!</b>

От: ${user.firstName} ${user.lastName || ''} ${user.companyName ? `(${user.companyName})` : ''}
Бюджет: ${budgetFormatted}₽
${createOfferDto.projectTitle ? `\nПроект: ${createOfferDto.projectTitle}` : ''}

Сообщение:
${createOfferDto.message || '—'}`;

        console.log('📤 Attempting to send message to Telegram ID:', telegramChatId);

        await this.telegramService.sendMessageWithButton(
          telegramChatId,
          message,
          'Посмотреть предложение',
          `offers/${savedOffer.id}`
        );

        console.log('✅ Telegram notification sent successfully');
      } catch (error) {
        console.error('❌ Failed to send Telegram notification:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
        });
      }
    } else {
      console.warn('⚠️ No Telegram ID found for blogger');
    }

    return savedOffer;
  }

  async findAllForBlogger(user: User) {
    const blogger = await this.bloggersService.findByUserId(user.id);
    if (!blogger) {
      return { data: [], total: 0 };
    }

    const [offers, total] = await this.offersRepository.findAndCount({
      where: { bloggerId: blogger.id },
      relations: ['advertiser', 'advertiser.user'],
      order: { createdAt: 'DESC' },
    });

    return { data: offers, total };
  }

  async findAllForAdvertiser(user: User) {
    const advertiser = await this.advertisersService.findByUserId(user.id);
    if (!advertiser) {
      return { data: [], total: 0 };
    }

    const [offers, total] = await this.offersRepository.findAndCount({
      where: { advertiserId: advertiser.id },
      relations: ['blogger', 'blogger.user'],
      order: { createdAt: 'DESC' },
    });

    return { data: offers, total };
  }

  async findOne(id: string, user: User) {
    const offer = await this.offersRepository.findOne({
      where: { id },
      relations: ['advertiser', 'advertiser.user', 'blogger', 'blogger.user'],
    });

    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }

    // Проверяем доступ
    const canAccess = 
      (user.role === 'blogger' && offer.blogger.userId === user.id) ||
      (user.role === 'advertiser' && offer.advertiser.userId === user.id);

    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этому предложению');
    }

    return offer;
  }

  async respond(id: string, respondDto: RespondOfferDto, user: User) {
    const offer = await this.findOne(id, user);

    // Только блогер может отвечать на предложение
    if (user.role !== 'blogger' || offer.blogger.userId !== user.id) {
      throw new ForbiddenException('Только блогер может отвечать на предложение');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Предложение уже обработано');
    }

    if (respondDto.accept) {
      offer.status = OfferStatus.ACCEPTED;
      offer.acceptedAt = new Date();

      // Создаем чат между блогером и рекламодателем
      try {
        const chat = await this.messagesService.createChat(
          offer.advertiser.userId,
          offer.blogger.userId,
          `Предложение: ${offer.projectTitle || 'Сотрудничество'}`
        );

        // Отправляем приветственное сообщение
        await this.messagesService.sendMessage(
          offer.advertiser.userId,
          chat.id,
          `Блогер принял ваше предложение! Бюджет: ${offer.proposedBudget}₽`
        );
      } catch (error) {
        console.error('Failed to create chat:', error);
      }
    } else {
      offer.status = OfferStatus.REJECTED;
      offer.rejectedAt = new Date();
      offer.rejectionReason = respondDto.rejectionReason;
    }

    await this.offersRepository.save(offer);

    // Уведомляем рекламодателя
    const advertiserUser = offer.advertiser.user as any;
      if (advertiserUser?.id) {
      try {
        const message = respondDto.accept
          ? `✅ <b>Ваше предложение принято!</b>\n\nБлогер ${offer.blogger.user.firstName} принял ваше предложение.\nОткройте приложение для общения.`
          : `❌ <b>Предложение отклонено</b>\n\nБлогер ${offer.blogger.user.firstName} отклонил ваше предложение.\n${respondDto.rejectionReason ? `Причина: ${respondDto.rejectionReason}` : ''}`;

        await this.telegramService.sendMessage(advertiserUser.id, message);
      } catch (error) {
        console.error('Failed to send Telegram notification:', error);
      }
    }

    return offer;
  }
}

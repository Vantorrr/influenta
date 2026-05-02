import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Offer, OfferStatus } from './entities/offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RespondOfferDto } from './dto/respond-offer.dto';
import { User } from '@/users/entities/user.entity';
import { TelegramService } from '@/telegram/telegram.service';
import { ChatService } from '@/chat/chat.service';
import { BloggersService } from '@/bloggers/bloggers.service';
import { AdvertisersService } from '@/advertisers/advertisers.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
    private telegramService: TelegramService,
    private chatService: ChatService,
    private bloggersService: BloggersService,
    private advertisersService: AdvertisersService,
    private configService: ConfigService,
  ) {}

  async create(createOfferDto: CreateOfferDto, user: User) {
    if (user.role !== 'advertiser' && user.role !== 'blogger') {
      throw new BadRequestException(
        'Только зарегистрированные пользователи могут отправлять предложения',
      );
    }

    if (user.role === 'blogger' && user.id === createOfferDto.bloggerId) {
      throw new BadRequestException('Нельзя отправить предложение самому себе');
    }

    const advertiser = await this.advertisersService.findOrCreateByUserId(user.id);
    if (!advertiser) {
      throw new BadRequestException('Профиль рекламодателя не найден');
    }

    const targetUser = await this.bloggersService.getUserById(createOfferDto.bloggerId);
    if (!targetUser || targetUser.role !== 'blogger') {
      throw new NotFoundException('Блогер не найден');
    }

    const blogger = {
      id: createOfferDto.bloggerId,
      userId: createOfferDto.bloggerId,
      user: targetUser,
    };

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

    const offer = this.offersRepository.create({
      ...createOfferDto,
      message: createOfferDto.message || '',
      advertiserId: advertiser.id,
      status: OfferStatus.PENDING,
    });

    const savedOffer = await this.offersRepository.save(offer);

    const bloggerUser = blogger.user as any;
    if (bloggerUser?.telegramId) {
      try {
        const isCollaboration = user.role === 'blogger';
        const message = isCollaboration
          ? `🤝 <b>Новое предложение о коллаборации!</b>\n\nОт блогера: ${user.firstName} ${user.lastName || ''}\nБюджет: ${createOfferDto.proposedBudget}₽${createOfferDto.projectTitle ? `\nПроект: ${createOfferDto.projectTitle}` : ''}\n\nСообщение:\n${createOfferDto.message || 'Без сообщения'}`
          : `🎯 <b>Новое предложение о сотрудничестве!</b>\n\nОт: ${user.firstName} ${user.lastName || ''} ${user.companyName ? `(${user.companyName})` : ''}\nБюджет: ${createOfferDto.proposedBudget}₽${createOfferDto.projectTitle ? `\nПроект: ${createOfferDto.projectTitle}` : ''}\n\nСообщение:\n${createOfferDto.message || 'Без сообщения'}`;

        await this.telegramService.sendMessageWithButton(
          bloggerUser.telegramId,
          message,
          'Посмотреть предложение',
          `offers/${savedOffer.id}`,
        );
      } catch (error) {
        this.logger.warn(
          `Failed to send offer Telegram notification to blogger ${bloggerUser.telegramId}: ${error?.message}`,
        );
      }
    } else {
      this.logger.warn(`No Telegram ID found for target blogger userId=${blogger.id}`);
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
      relations: ['blogger'],
      order: { createdAt: 'DESC' },
    });

    return { data: offers, total };
  }

  async findOne(id: string, user: User) {
    const offer = await this.offersRepository.findOne({
      where: { id },
      relations: ['advertiser', 'advertiser.user', 'blogger'],
    });

    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }

    const canAccess =
      (user.role === 'blogger' && offer.blogger?.id === user.id) ||
      (user.role === 'advertiser' && offer.advertiser?.userId === user.id);

    if (!canAccess) {
      throw new ForbiddenException('Нет доступа к этому предложению');
    }

    return offer;
  }

  async respond(id: string, respondDto: RespondOfferDto, user: User) {
    const offer = await this.findOne(id, user);

    if (user.role !== 'blogger' || offer.blogger?.id !== user.id) {
      throw new ForbiddenException('Только блогер может отвечать на предложение');
    }

    if (offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException('Предложение уже обработано');
    }

    let chatId: string | null = null;
    let chatCreated = false;
    let chatError: string | undefined;

    if (respondDto.accept) {
      offer.status = OfferStatus.ACCEPTED;
      offer.acceptedAt = new Date();
      await this.offersRepository.save(offer);

      try {
        const chat = await this.chatService.ensureChatForOffer(offer);
        chatId = chat.id;
        chatCreated = true;

        try {
          await this.chatService.appendSystemMessage(
            chat,
            `Блогер принял ваше предложение! Бюджет: ${offer.proposedBudget}₽`,
          );
        } catch (msgErr) {
          this.logger.warn(
            `Failed to append welcome message to offer chat ${chat.id}: ${msgErr?.message}`,
          );
        }
      } catch (error) {
        chatError = error?.message || 'Unknown error';
        this.logger.error(
          `Failed to create chat for accepted offerId=${offer.id}: ${chatError}`,
        );
      }
    } else {
      offer.status = OfferStatus.REJECTED;
      offer.rejectedAt = new Date();
      offer.rejectionReason = respondDto.rejectionReason;
      await this.offersRepository.save(offer);
    }

    // Уведомляем рекламодателя
    const advertiserUser = offer.advertiser?.user as any;
    if (advertiserUser?.telegramId) {
      try {
        if (respondDto.accept) {
          const frontendUrl =
            this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app';
          const message = `✅ <b>Ваше предложение принято!</b>\n\nБлогер ${offer.blogger?.firstName || 'Блогер'} принял ваше предложение.\nОткройте приложение для общения.`;
          const replyMarkup = chatId
            ? {
                inline_keyboard: [
                  [
                    {
                      text: 'Открыть чат',
                      web_app: { url: `${frontendUrl}/messages?chatId=${chatId}` },
                    },
                  ],
                ],
              }
            : undefined;
          await this.telegramService.sendMessage(
            advertiserUser.telegramId,
            message,
            replyMarkup,
          );
        } else {
          const message = `❌ <b>Предложение отклонено</b>\n\nБлогер ${offer.blogger?.firstName || 'Блогер'} отклонил ваше предложение.\n${respondDto.rejectionReason ? `Причина: ${respondDto.rejectionReason}` : ''}`;
          await this.telegramService.sendMessage(advertiserUser.telegramId, message);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to notify advertiser about offer ${offer.id}: ${error?.message}`,
        );
      }
    }

    return {
      ...offer,
      chatId,
      chatCreated,
      chatError,
    };
  }
}

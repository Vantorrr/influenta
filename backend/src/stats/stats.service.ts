import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { Listing } from '@/listings/entities/listing.entity';
import { Response } from '@/responses/entities/response.entity';
import { Chat } from '@/chat/entities/chat.entity';
import { ListingStatus } from '@/types';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Response)
    private responsesRepository: Repository<Response>,
    @InjectRepository(Chat)
    private chatsRepository: Repository<Chat>,
  ) {}

  async getDashboardStats(user: User) {
    if (user.role === 'blogger') {
      return this.getBloggerStats(user);
    } else {
      return this.getAdvertiserStats(user);
    }
  }

  private async getBloggerStats(user: User) {
    // Получаем статистику блогера
    const [activeResponses, totalEarnings, recentActivity] = await Promise.all([
      // Активные отклики
      this.responsesRepository.count({
        where: { 
          blogger: { id: user.id },
          status: 'pending'
        }
      }),
      
      // Общий заработок
      this.responsesRepository
        .createQueryBuilder('response')
        .select('SUM(response.price)', 'total')
        .where('response.bloggerId = :userId', { userId: user.id })
        .andWhere('response.status = :status', { status: 'accepted' })
        .getRawOne(),
      
      // Последняя активность
      this.getRecentActivity(user.id, 'blogger'),
    ]);

    return {
      profileViews: 0, // TODO: Implement view tracking
      profileViewsChange: 0,
      activeResponses,
      activeResponsesChange: 0, // TODO: Calculate changes
      earnings: totalEarnings?.total || 0,
      earningsChange: 0,
      rating: 0, // TODO: Implement rating system
      ratingChange: 0,
      recentActivity,
    };
  }

  private async getAdvertiserStats(user: User) {
    // Получаем статистику рекламодателя
    const [activeCampaigns, totalResponses, totalSpent, recentActivity] = await Promise.all([
      // Активные кампании
      this.listingsRepository.count({
        where: { 
          advertiser: { id: user.id },
          status: ListingStatus.ACTIVE
        }
      }),
      
      // Всего откликов
      this.responsesRepository
        .createQueryBuilder('response')
        .leftJoin('response.listing', 'listing')
        .where('listing.advertiserId = :userId', { userId: user.id })
        .getCount(),
      
      // Общие расходы
      this.responsesRepository
        .createQueryBuilder('response')
        .leftJoin('response.listing', 'listing')
        .select('SUM(response.price)', 'total')
        .where('listing.advertiserId = :userId', { userId: user.id })
        .andWhere('response.status = :status', { status: 'accepted' })
        .getRawOne(),
      
      // Последняя активность
      this.getRecentActivity(user.id, 'advertiser'),
    ]);

    return {
      activeCampaigns,
      activeCampaignsChange: 0,
      totalResponses,
      totalResponsesChange: 0,
      totalSpent: totalSpent?.total || 0,
      totalSpentChange: 0,
      roi: 0, // TODO: Calculate ROI
      roiChange: 0,
      recentActivity,
    };
  }

  private async getRecentActivity(userId: string, role: 'blogger' | 'advertiser') {
    const activities: any[] = [];

    if (role === 'blogger') {
      // Последние отклики
      const responses = await this.responsesRepository.find({
        where: { blogger: { id: userId } },
        relations: ['listing'],
        order: { createdAt: 'DESC' },
        take: 3,
      });

      responses.forEach(response => {
        activities.push({
          id: response.id,
          type: 'response',
          title: `Отклик на "${response.listing.title}"`,
          time: response.createdAt,
          status: response.status === 'pending' ? 'new' : response.status,
        });
      });

      // Последние сообщения
      const chats = await this.chatsRepository.find({
        where: [
          { blogger: { id: userId } },
        ],
        relations: ['advertiser', 'listing'],
        order: { updatedAt: 'DESC' },
        take: 2,
      });

      chats.forEach(chat => {
        activities.push({
          id: chat.id,
          type: 'message',
          title: `Сообщение от ${chat.advertiser.firstName || 'Рекламодатель'}`,
          time: chat.updatedAt,
          status: 'unread', // TODO: Track read status
        });
      });
    } else {
      // Для рекламодателя - новые отклики на его объявления
      const responses = await this.responsesRepository
        .createQueryBuilder('response')
        .leftJoinAndSelect('response.listing', 'listing')
        .leftJoinAndSelect('response.blogger', 'blogger')
        .where('listing.advertiserId = :userId', { userId })
        .orderBy('response.createdAt', 'DESC')
        .take(5)
        .getMany();

      responses.forEach(response => {
        activities.push({
          id: response.id,
          type: 'response',
          title: `Новый отклик от ${response.blogger.firstName || 'Блогер'} на "${response.listing.title}"`,
          time: response.createdAt,
          status: 'new',
        });
      });
    }

    // Сортируем по времени
    return activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
import { BloggerSearchDto } from './dto/blogger-search.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class BloggersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async search(searchDto: BloggerSearchDto, paginationDto: PaginationDto) {
    const { search, categories, verifiedOnly } = searchDto;
    const { page = 1, limit = 20 } = paginationDto;

    const query = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'blogger' })
      .andWhere('user.isActive = :isActive', { isActive: true });

    // Поиск по имени или username
    if (search) {
      query.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.username ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Фильтр по верификации
    if (verifiedOnly) {
      query.andWhere('user.isVerified = :isVerified', { isVerified: true });
    }

    // TODO: Implement category filtering when blogger profiles are ready

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Преобразуем пользователей в блогеров
    const bloggers = data.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName || '',
      username: user.username || '',
      bio: '', // TODO: Add bio field to user or create blogger profile
      categories: [], // TODO: Add categories
      subscribersCount: 0, // TODO: Track subscribers
      averageViews: 0, // TODO: Track views
      engagementRate: 0, // TODO: Calculate engagement
      pricePerPost: 0, // TODO: Add pricing
      pricePerStory: 0, // TODO: Add pricing
      rating: 0, // TODO: Implement rating system
      completedCampaigns: 0, // TODO: Track campaigns
      telegramId: user.telegramId,
      role: user.role,
      email: user.email,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    return {
      data: bloggers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id, role: 'blogger', isActive: true },
    });

    if (!user) {
      throw new NotFoundException('Blogger not found');
    }

    // Преобразуем пользователя в блогера
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName || '',
      username: user.username || '',
      bio: '', // TODO: Add bio field
      categories: [], // TODO: Add categories
      subscribersCount: 0, // TODO: Track subscribers
      averageViews: 0, // TODO: Track views
      engagementRate: 0, // TODO: Calculate engagement
      pricePerPost: 0, // TODO: Add pricing
      pricePerStory: 0, // TODO: Add pricing
      rating: 0, // TODO: Implement rating system
      completedCampaigns: 0, // TODO: Track campaigns
      telegramId: user.telegramId,
      role: user.role,
      email: user.email,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

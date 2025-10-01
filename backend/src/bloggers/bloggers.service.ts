import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '@/users/entities/user.entity';
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
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: UserRole.BLOGGER });

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

    console.log('🔍 Bloggers search:', { 
      total, 
      found: data.length, 
      users: data.map(u => ({ id: u.id, firstName: u.firstName, role: u.role }))
    });

    // Преобразуем пользователей в блогеров с реальными данными
    const bloggers = data.map(user => ({
      id: user.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        username: user.username || '',
        photoUrl: user.photoUrl,
        isVerified: user.isVerified,
      },
      bio: user.bio || '',
      categories: user.categories ? user.categories.split(',').filter(Boolean) : [],
      subscribersCount: user.subscribersCount || 0,
      averageViews: Math.floor((user.subscribersCount || 0) * 0.35), // ~35% от подписчиков
      engagementRate: 4.2, // Временно захардкодим
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      rating: 4.8, // Временно захардкодим
      completedCampaigns: 0, // TODO: Track campaigns
      isVerified: user.isVerified,
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
      where: { id, isActive: true, role: UserRole.BLOGGER },
    });

    if (!user) {
      throw new NotFoundException('Blogger not found');
    }

    // Преобразуем пользователя в блогера с реальными данными
    return {
      id: user.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName || '',
        username: user.username || '',
        photoUrl: user.photoUrl,
        isVerified: user.isVerified,
      },
      bio: user.bio || '',
      categories: user.categories ? user.categories.split(',').filter(Boolean) : [],
      subscribersCount: user.subscribersCount || 0,
      averageViews: Math.floor((user.subscribersCount || 0) * 0.35), // ~35% от подписчиков
      engagementRate: 4.2, // Временно захардкодим
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      rating: 4.8, // Временно захардкодим
      completedCampaigns: 0, // TODO: Track campaigns
      isVerified: user.isVerified,
    };
  }

  async getAllUsers() {
    const users = await this.usersRepository.find({
      select: ['id', 'firstName', 'lastName', 'username', 'role', 'isActive', 'isVerified', 'bio', 'subscribersCount', 'pricePerPost', 'pricePerStory', 'categories']
    });
    
    console.log('🔍 All users:', users);
    return users;
  }
}






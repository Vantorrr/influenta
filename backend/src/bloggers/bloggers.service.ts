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
    const { search, categories, verifiedOnly, minSubscribers, maxSubscribers, minPrice, maxPrice } = searchDto;
    const { page = 1, limit = 20 } = paginationDto;

    console.log('🔍 Search filters:', { minSubscribers, maxSubscribers, minPrice, maxPrice, search, categories, verifiedOnly });

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

    // Фильтр по тематикам
    if (categories && categories.length > 0) {
      // у нас categories в users храним как строку через запятую
      query.andWhere("user.categories IS NOT NULL AND user.categories <> ''")
      for (const c of categories) {
        query.andWhere(`user.categories ILIKE :cat_${c}`, { [`cat_${c}`]: `%${c}%` })
      }
    }

    // Фильтр по минимальным подписчикам
    if (typeof minSubscribers === 'number' && !Number.isNaN(minSubscribers)) {
      query.andWhere('COALESCE(user.subscribersCount, 0) >= :minSubs', { minSubs: minSubscribers })
    }

    // Фильтр по максимальным подписчикам
    if (typeof maxSubscribers === 'number' && !Number.isNaN(maxSubscribers)) {
      query.andWhere('COALESCE(user.subscribersCount, 0) <= :maxSubs', { maxSubs: maxSubscribers })
    }

    // Фильтр по минимальной цене поста
    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
      query.andWhere('COALESCE(user.pricePerPost, 0) >= :minPrice', { minPrice })
    }

    // Фильтр по максимальной цене поста
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
      query.andWhere('COALESCE(user.pricePerPost, 0) <= :maxPrice', { maxPrice })
    }

    console.log('📝 SQL Query:', query.getSql());
    console.log('📝 Parameters:', query.getParameters());

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log('🔍 Bloggers search result:', { 
      total, 
      found: data.length, 
      users: data.map(u => ({ id: u.id, firstName: u.firstName, role: u.role, subscribersCount: u.subscribersCount, pricePerPost: u.pricePerPost }))
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
      engagementRate: 0, // TODO: Рассчитывать на основе реальной статистики
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      rating: 0, // TODO: Рассчитывать на основе отзывов
      completedCampaigns: 0, // TODO: Рассчитывать на основе завершенных откликов
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
      engagementRate: 0, // TODO: Рассчитывать на основе реальной статистики
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      rating: 0, // TODO: Рассчитывать на основе отзывов
      completedCampaigns: 0, // TODO: Рассчитывать на основе завершенных откликов
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

  async getUserById(userId: string): Promise<any> {
    return this.usersRepository.findOne({ 
      where: { id: userId },
    });
  }

  async findByUserId(userId: string): Promise<any> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId, role: UserRole.BLOGGER },
    });
    
    if (!user) {
      return null;
    }
    
    // Возвращаем структуру похожую на Blogger entity
    return {
      id: user.id,
      userId: user.id,
      user: user,
      subscribersCount: user.subscribersCount || 0,
      averageViews: Math.floor((user.subscribersCount || 0) * 0.35),
      categories: user.categories ? user.categories.split(',').filter(Boolean) : [],
      isActive: user.isActive,
    };
  }
}










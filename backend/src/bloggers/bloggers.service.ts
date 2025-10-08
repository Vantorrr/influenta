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
      // у нас categories в users храним как строку через запятую (могут быть как ключи enum, так и русские лейблы)
      query.andWhere("user.categories IS NOT NULL AND user.categories <> ''")
      for (const raw of categories) {
        const c = String(raw)
        const ru = (c.charAt(0) === c.charAt(0).toUpperCase()) ? c : undefined // эвристика: приходят на русском с большой буквы
        const eng = c.toLowerCase()
        query.andWhere('(user.categories ILIKE :catEng OR user.categories ILIKE :catRu)', {
          catEng: `%${eng}%`,
          catRu: ru ? `%${ru}%` : `%${eng}%`,
        })
      }
    }

    // Фильтр по минимальным подписчикам
    if (minSubscribers !== undefined && minSubscribers !== null) {
      const minSubsNum = Number(minSubscribers);
      if (!Number.isNaN(minSubsNum)) {
        console.log('✅ Applying minSubscribers filter:', minSubsNum);
        query.andWhere('COALESCE(user.subscribersCount, 0) >= :minSubs', { minSubs: minSubsNum });
      }
    }

    // Фильтр по максимальным подписчикам
    if (maxSubscribers !== undefined && maxSubscribers !== null) {
      const maxSubsNum = Number(maxSubscribers);
      if (!Number.isNaN(maxSubsNum)) {
        console.log('✅ Applying maxSubscribers filter:', maxSubsNum);
        query.andWhere('COALESCE(user.subscribersCount, 0) <= :maxSubs', { maxSubs: maxSubsNum });
      }
    }

    // Фильтр по минимальной цене поста
    if (minPrice !== undefined && minPrice !== null) {
      const minPriceNum = Number(minPrice);
      if (!Number.isNaN(minPriceNum)) {
        console.log('✅ Applying minPrice filter:', minPriceNum);
        query.andWhere('COALESCE(user.pricePerPost, 0) >= :minPrice', { minPrice: minPriceNum });
      }
    }

    // Фильтр по максимальной цене поста
    if (maxPrice !== undefined && maxPrice !== null) {
      const maxPriceNum = Number(maxPrice);
      if (!Number.isNaN(maxPriceNum)) {
        console.log('✅ Applying maxPrice filter:', maxPriceNum);
        query.andWhere('COALESCE(user.pricePerPost, 0) <= :maxPrice', { maxPrice: maxPriceNum });
      }
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










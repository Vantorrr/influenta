import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '@/users/entities/user.entity';
import { Blogger } from './entities/blogger.entity';
import { SocialPlatform } from '@/social-platforms/entities/social-platform.entity';
import { BloggerSearchDto } from './dto/blogger-search.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';

@Injectable()
export class BloggersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(SocialPlatform)
    private socialPlatformsRepository: Repository<SocialPlatform>,
  ) {}

  async onModuleInit() {
    try {
      // Auto-migration for new columns
      await this.usersRepository.query(`
        ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS "adminNotes" text;
        ALTER TABLE bloggers ADD COLUMN IF NOT EXISTS "isFeatured" boolean DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS country varchar(16);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "isBanned" boolean NOT NULL DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "banReason" text;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "bannedAt" timestamptz;
        CREATE INDEX IF NOT EXISTS idx_users_country ON users (country);
        CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users ("isBanned");
      `);
      console.log('✅ Bloggers schema fixed');
    } catch (e) {
      console.error('❌ Failed to fix bloggers schema', e);
    }
  }

  async search(searchDto: BloggerSearchDto & { minSubscribers?: number; maxSubscribers?: number; minPrice?: number; maxPrice?: number; minViews30days?: number; maxViews30days?: number; minUniqueViewers30days?: number; maxUniqueViewers30days?: number; countries?: string[] }, paginationDto: PaginationDto) {
    const { search, categories, verifiedOnly, minSubscribers, maxSubscribers, minPrice, maxPrice, minViews30days, maxViews30days, minUniqueViewers30days, maxUniqueViewers30days, countries } = searchDto as any;
    const platform = (searchDto as any)?.platform as string | undefined;
    const { page = 1, limit = 20 } = paginationDto;

    console.log('🔍 Search params:', { minViews30days, maxViews30days, minUniqueViewers30days, maxUniqueViewers30days, platform, verifiedOnly });

    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndMapOne('user.blogger', Blogger, 'blogger', 'blogger.userId = user.id')
      .leftJoinAndSelect('user.socialPlatforms', 'socialPlatforms', 'socialPlatforms.isActive = :spActive', { spActive: true })
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

    // Фильтр по тематикам (хотя бы одна из выбранных)
    if (categories && (categories as any).length > 0) {
      // у нас categories в users храним как строку через запятую
      const cats: string[] = Array.isArray(categories) ? (categories as unknown as string[]) : []
      const orConditions = cats.map((c: string, i: number) => `user.categories ILIKE :cat_${i}`).join(' OR ')
      const params: any = {}
      cats.forEach((c: string, i: number) => {
        params[`cat_${i}`] = `%${c}%`
      })
      query.andWhere(`(${orConditions})`, params)
    }

    // Фильтр по минимальным подписчикам
    if (typeof minSubscribers === 'number' && !Number.isNaN(minSubscribers)) {
      query.andWhere('COALESCE(user.subscribersCount, 0) >= :minSubs', { minSubs: minSubscribers })
    }

    // Фильтр по максимальным подписчикам
    if (typeof maxSubscribers === 'number' && !Number.isNaN(maxSubscribers)) {
      query.andWhere('COALESCE(user.subscribersCount, 0) <= :maxSubs', { maxSubs: maxSubscribers })
    }

    // Фильтр по минимальной цене
    if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
      query.andWhere('COALESCE(user.pricePerPost, 0) >= :minPrice', { minPrice })
    }

    // Фильтр по максимальной цене поста
    if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
      query.andWhere('COALESCE(user.pricePerPost, 0) <= :maxPrice', { maxPrice })
    }

    // Фильтр по просмотрам за 30 дней (из social_platforms.additionalInfo)
    if (typeof minViews30days === 'number' && !Number.isNaN(minViews30days)) {
      query.andWhere(`
        EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."userId" = user.id 
          AND COALESCE((sp."additionalInfo"->>'views30days')::int, 0) >= :minViews30days
        )
      `, { minViews30days })
    }

    if (typeof maxViews30days === 'number' && !Number.isNaN(maxViews30days)) {
      query.andWhere(`
        EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."userId" = user.id 
          AND COALESCE((sp."additionalInfo"->>'views30days')::int, 0) <= :maxViews30days
        )
      `, { maxViews30days })
    }

    // Фильтр по уникальным зрителям за 30 дней
    if (typeof minUniqueViewers30days === 'number' && !Number.isNaN(minUniqueViewers30days)) {
      query.andWhere(`
        EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."userId" = user.id 
          AND COALESCE((sp."additionalInfo"->>'uniqueViewers30days')::int, 0) >= :minUniqueViewers30days
        )
      `, { minUniqueViewers30days })
    }

    if (typeof maxUniqueViewers30days === 'number' && !Number.isNaN(maxUniqueViewers30days)) {
      query.andWhere(`
        EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."userId" = user.id 
          AND COALESCE((sp."additionalInfo"->>'uniqueViewers30days')::int, 0) <= :maxUniqueViewers30days
        )
      `, { maxUniqueViewers30days })
    }

    // Фильтр по платформе
    if (platform) {
      query.andWhere(`
        EXISTS (
          SELECT 1 FROM social_platforms sp
          WHERE sp."userId" = user.id AND sp.platform = :platform
        )
      `, { platform })
    }

    // Фильтр по странам
    const countriesList: string[] = Array.isArray(countries)
      ? countries.filter(Boolean)
      : typeof countries === 'string' && countries
        ? [countries]
        : [];
    if (countriesList.length > 0) {
      query.andWhere('user.country IN (:...countries)', { countries: countriesList });
    }

    const [data, total] = await query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log('🔍 Bloggers search:', { 
      total, 
      found: data.length, 
      users: data.map(u => ({ id: u.id, firstName: u.firstName, role: u.role }))
    });

    // Преобразуем пользователей в блогеров с реальными данными
    const bloggers = data.map(user => {
      // Считаем общую статистику по всем активным платформам
      const platforms = user.socialPlatforms || [];
      const totalSubscribers = platforms.reduce((sum, p) => sum + (p.subscribersCount || 0), 0);
      const totalViews = platforms.reduce((sum, p) => sum + (p.additionalInfo?.views30days || 0), 0);
      
      // Если платформ нет, берем старые данные (fallback)
      const finalSubscribers = totalSubscribers > 0 ? totalSubscribers : (user.subscribersCount || 0);
      const finalViews = totalViews > 0 ? totalViews : Math.floor(finalSubscribers * 0.35);

      return {
        id: user.id,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName || '',
          username: user.username || '',
          photoUrl: user.photoUrl,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        },
        bio: user.bio || '',
        categories: user.categories ? user.categories.split(',').filter(Boolean) : [],
        subscribersCount: finalSubscribers,
        averageViews: finalViews, 
        pricePerPost: user.pricePerPost || 0,
        pricePerStory: user.pricePerStory || 0,
        isVerified: user.isVerified,
        isFeatured: (user as any).blogger?.isFeatured || false,
        createdAt: user.createdAt,
        socialPlatforms: platforms.map(p => ({
          platform: p.platform,
          username: p.username,
          subscribersCount: p.subscribersCount
        }))
      };
    });

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
    const user = await this.usersRepository.createQueryBuilder('user')
      .leftJoinAndMapOne('user.blogger', Blogger, 'blogger', 'blogger.userId = user.id')
      .leftJoinAndSelect('user.socialPlatforms', 'socialPlatforms', 'socialPlatforms.isActive = :spActive', { spActive: true })
      .where('user.id = :id', { id })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere('user.role = :role', { role: UserRole.BLOGGER })
      .getOne();

    if (!user) {
      throw new NotFoundException('Blogger not found');
    }

    // Считаем общую статистику
    const platforms = user.socialPlatforms || [];
    const totalSubscribers = platforms.reduce((sum, p) => sum + (p.subscribersCount || 0), 0);
    const totalViews = platforms.reduce((sum, p) => sum + (p.additionalInfo?.views30days || 0), 0);
    
    const finalSubscribers = totalSubscribers > 0 ? totalSubscribers : (user.subscribersCount || 0);
    const finalViews = totalViews > 0 ? totalViews : Math.floor(finalSubscribers * 0.35);

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
        createdAt: user.createdAt,
      },
      bio: user.bio || '',
      categories: user.categories ? user.categories.split(',').filter(Boolean) : [],
      subscribersCount: finalSubscribers,
      averageViews: finalViews,
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      isVerified: user.isVerified,
      isFeatured: (user as any).blogger?.isFeatured || false,
      adminNotes: (user as any).blogger?.adminNotes,
      socialPlatforms: platforms.map(p => ({
        platform: p.platform,
        username: p.username,
        subscribersCount: p.subscribersCount
      }))
    };
  }

  async getAllUsers() {
    const users = await this.usersRepository.find({
      select: [
        'id',
        'telegramId',
        'firstName',
        'lastName',
        'username',
        'role',
        'isActive',
        'isBanned',
        'banReason',
        'bannedAt',
        'isVerified',
        'bio',
        'subscribersCount',
        'pricePerPost',
        'pricePerStory',
        'categories',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
    return { data: users };
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









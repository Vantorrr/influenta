import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Добавить в избранное
  async add(userId: string, bloggerId: string): Promise<Favorite> {
    // Проверяем, не добавлен ли уже
    const existing = await this.favoritesRepository.findOne({
      where: { userId, bloggerId },
    });

    if (existing) {
      throw new ConflictException('Блогер уже в избранном');
    }

    const favorite = this.favoritesRepository.create({
      userId,
      bloggerId,
    });

    return this.favoritesRepository.save(favorite);
  }

  // Убрать из избранного
  async remove(userId: string, bloggerId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, bloggerId },
    });

    if (!favorite) {
      throw new NotFoundException('Блогер не найден в избранном');
    }

    await this.favoritesRepository.remove(favorite);
  }

  // Переключить состояние (добавить/убрать)
  async toggle(userId: string, bloggerId: string): Promise<{ isFavorite: boolean }> {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, bloggerId },
    });

    if (existing) {
      await this.favoritesRepository.remove(existing);
      return { isFavorite: false };
    } else {
      const favorite = this.favoritesRepository.create({ userId, bloggerId });
      await this.favoritesRepository.save(favorite);
      return { isFavorite: true };
    }
  }

  // Проверить, в избранном ли
  async check(userId: string, bloggerId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, bloggerId },
    });
    return !!favorite;
  }

  // Проверить несколько блогеров сразу (для списка)
  async checkMany(userId: string, bloggerIds: string[]): Promise<Record<string, boolean>> {
    if (!bloggerIds.length) return {};

    const favorites = await this.favoritesRepository.find({
      where: bloggerIds.map(bloggerId => ({ userId, bloggerId })),
    });

    const result: Record<string, boolean> = {};
    bloggerIds.forEach(id => {
      result[id] = favorites.some(f => f.bloggerId === id);
    });

    return result;
  }

  // Список избранных блогеров
  async getList(userId: string, page = 1, limit = 50): Promise<{ data: any[]; total: number }> {
    const [favorites, total] = await this.favoritesRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Получаем данные блогеров
    const bloggerIds = favorites.map(f => f.bloggerId);
    
    if (!bloggerIds.length) {
      return { data: [], total: 0 };
    }

    const users = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndMapOne('user.blogger', Blogger, 'blogger', 'blogger.userId = user.id')
      .where('user.id IN (:...ids)', { ids: bloggerIds })
      .andWhere('user.role = :role', { role: UserRole.BLOGGER })
      .getMany();

    // Маппим в формат блогера
    const bloggers = users.map(user => ({
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
      subscribersCount: user.subscribersCount || 0,
      averageViews: Math.floor((user.subscribersCount || 0) * 0.35),
      pricePerPost: user.pricePerPost || 0,
      pricePerStory: user.pricePerStory || 0,
      isVerified: user.isVerified,
      isFeatured: (user as any).blogger?.isFeatured || false,
      isFavorite: true, // Все в этом списке — избранные
      addedAt: favorites.find(f => f.bloggerId === user.id)?.createdAt,
    }));

    // Сортируем по дате добавления
    bloggers.sort((a, b) => {
      const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return dateB - dateA;
    });

    return { data: bloggers, total };
  }

  // Количество избранных
  async getCount(userId: string): Promise<number> {
    return this.favoritesRepository.count({ where: { userId } });
  }
}


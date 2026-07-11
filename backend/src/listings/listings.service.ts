import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { User, UserRole } from '@/users/entities/user.entity';
import { ListingSearchDto } from './dto/listing-search.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ListingStatus } from '@/types';
import { TelegramService } from '@/telegram/telegram.service';

const FORMAT_LABELS: Record<string, string> = {
  post: 'Пост',
  story: 'Сторис',
  live: 'Эфир/Reels',
  post_and_story: 'Пост + Сторис',
  any: 'Любой формат',
};

@Injectable()
export class ListingsService implements OnModuleInit {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Advertiser)
    private advertisersRepository: Repository<Advertiser>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Self-healing миграция: гарантирует наличие колонки useSafeDeal в проде,
   * где synchronize отключён.
   */
  async onModuleInit() {
    try {
      await this.listingsRepository.query(
        'ALTER TABLE listings ADD COLUMN IF NOT EXISTS "useSafeDeal" boolean NOT NULL DEFAULT false;',
      );
      this.logger.log('✅ listings.useSafeDeal schema ensured');
    } catch (e: any) {
      this.logger.error(`Failed to ensure listings.useSafeDeal: ${e?.message}`);
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Уведомляет блогеров о новом объявлении. Матчит по тематикам (если заданы),
   * иначе шлёт всем активным блогерам. Работает в фоне (fire-and-forget),
   * с троттлингом, чтобы не упереться в лимиты Telegram.
   */
  private async notifyBloggersAboutListing(listing: Listing) {
    try {
      const targetCategories: string[] = Array.isArray(listing.targetCategories)
        ? (listing.targetCategories as unknown as string[]).filter(Boolean)
        : [];

      const baseQb = () =>
        this.usersRepository
          .createQueryBuilder('user')
          .select(['user.id', 'user.telegramId'])
          .where('user.role = :role', { role: UserRole.BLOGGER })
          .andWhere('user.isActive = :active', { active: true })
          .andWhere('user.telegramId IS NOT NULL')
          .andWhere("user.telegramId <> ''");

      // Пытаемся матчить по тематикам блогера, но т.к. категории у пользователей
      // заполняются не всегда, при отсутствии совпадений уведомляем всех активных
      // блогеров — так объявление точно дойдёт до аудитории.
      let bloggers: Array<{ id: string; telegramId: string }> = [];

      if (targetCategories.length > 0) {
        const qb = baseQb();
        const conds = targetCategories.map((_, i) => `user.categories ILIKE :cat_${i}`);
        const params: Record<string, string> = {};
        targetCategories.forEach((c, i) => {
          params[`cat_${i}`] = `%${c}%`;
        });
        qb.andWhere(`(${conds.join(' OR ')})`, params);
        bloggers = await qb.getMany();
      }

      // Fallback: категории не заданы или ни один блогер не совпал по тематике
      if (bloggers.length === 0) {
        bloggers = await baseQb().getMany();
      }

      // Дедуп telegramId + валидные числовые id
      const chatIds = Array.from(
        new Set(
          bloggers
            .map((b) => parseInt(String(b.telegramId), 10))
            .filter((id) => Number.isFinite(id)),
        ),
      );

      if (chatIds.length === 0) {
        this.logger.log(`New listing ${listing.id}: no bloggers to notify`);
        return;
      }

      const formatLabel = FORMAT_LABELS[String(listing.format)] || 'Любой формат';
      const budget = Number(listing.budget);
      const budgetStr = Number.isFinite(budget) ? `${budget.toLocaleString('ru-RU')}₽` : '—';
      const descr = (listing.description || '').trim();
      const shortDescr = descr.length > 180 ? descr.slice(0, 180) + '…' : descr;

      const safeDealLine = listing.useSafeDeal ? `\n🛡 <b>Безопасная сделка</b> — оплата через эскроу` : '';

      const text =
        `📢 <b>Новое объявление для блогеров</b>\n\n` +
        `<b>${listing.title}</b>\n` +
        `💰 Бюджет: ${budgetStr}\n` +
        `🎬 Формат: ${formatLabel}` +
        safeDealLine +
        (shortDescr ? `\n\n${shortDescr}` : '');

      this.logger.log(`New listing ${listing.id}: notifying ${chatIds.length} bloggers`);

      let sent = 0;
      for (let i = 0; i < chatIds.length; i++) {
        try {
          await this.telegramService.sendMessageWithButton(
            chatIds[i],
            text,
            '👀 Открыть объявление',
            `listings/${listing.id}`,
          );
          sent++;
        } catch (e: any) {
          // Пользователь мог заблокировать бота — просто пропускаем
        }
        // Троттлинг: пауза каждые 20 сообщений + небольшой интервал
        if ((i + 1) % 20 === 0) {
          await this.sleep(700);
        } else {
          await this.sleep(60);
        }
      }
      this.logger.log(`New listing ${listing.id}: delivered ${sent}/${chatIds.length}`);
    } catch (e: any) {
      this.logger.error(`notifyBloggersAboutListing failed for ${listing?.id}: ${e?.message}`);
    }
  }

  async search(searchDto: ListingSearchDto, paginationDto: PaginationDto) {
    const { search, status = ListingStatus.ACTIVE, minBudget, maxBudget, format } = searchDto;
    const { page = 1, limit = 20 } = paginationDto;

    console.log('🔍 Listings search with status:', status);

    const query = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.advertiser', 'advertiser');
    
    // Если статус "archive" - показываем все кроме активных, иначе фильтруем по статусу
    if ((status as string) === 'archive') {
      console.log('📦 Fetching archive listings (not active)');
      query.where('listing.status != :activeStatus', { activeStatus: ListingStatus.ACTIVE });
    } else {
      console.log('📋 Fetching listings with status:', status);
      query.where('listing.status = :status', { status });
    }

    // Поиск по названию или описанию
    if (search) {
      query.andWhere(
        '(listing.title ILIKE :search OR listing.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (typeof minBudget === 'number' && !Number.isNaN(minBudget)) {
      query.andWhere('listing.budget >= :minBudget', { minBudget })
    }

    if (typeof maxBudget === 'number' && !Number.isNaN(maxBudget)) {
      query.andWhere('listing.budget <= :maxBudget', { maxBudget })
    }

    if (format) {
      query.andWhere('listing.format = :format', { format })
    }

    const [data, total] = await query
      .orderBy('listing.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    console.log('📊 Listings found:', total, 'statuses:', data.map(l => l.status));

    return {
      data: data.map(listing => this.formatListing(listing)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['advertiser', 'advertiser.user'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Увеличиваем счетчик просмотров
    await this.listingsRepository.increment({ id }, 'viewsCount', 1);

    return this.formatListing(listing);
  }

  async getMyListings(user: User, paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto
    // ensure advertiser
    const advertiser = await this.advertisersRepository.findOne({ where: { userId: user.id } })
    if (!advertiser) {
      return { data: [], meta: { total: 0, page, limit, totalPages: 0 } }
    }
    const [data, total] = await this.listingsRepository.findAndCount({
      where: { advertiserId: advertiser.id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
    return {
      data: data.map(l => this.formatListing({ ...(l as any), advertiser } as any)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async create(createListingDto: CreateListingDto, user: User) {
    if (user.role !== 'advertiser') {
      throw new ForbiddenException('Only advertisers can create listings');
    }

    // Ensure Advertiser entity exists for this user
    let advertiser = await this.advertisersRepository.findOne({ where: { userId: user.id } });
    if (!advertiser) {
      advertiser = this.advertisersRepository.create({
        user: user as any,
        userId: user.id,
        companyName: user.companyName || `${user.firstName} ${user.lastName || ''}`.trim(),
        website: (user as any).website || null,
        isVerified: user.isVerified,
      });
      advertiser = await this.advertisersRepository.save(advertiser);
    }

    const listing = new Listing();
    Object.assign(listing, createListingDto);
    listing.advertiserId = advertiser.id;
    listing.advertiser = advertiser as any;
    listing.status = ListingStatus.ACTIVE;
    listing.viewsCount = 0;
    listing.responsesCount = 0;

    await this.listingsRepository.save(listing);

    // Фоново уведомляем блогеров о новом объявлении (не блокируем ответ)
    void this.notifyBloggersAboutListing(listing);

    return this.formatListing(listing);
  }

  async update(id: string, updateListingDto: UpdateListingDto, user: User) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['advertiser'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Ownership check (supports legacy records)
    const myAdvertiser = await this.advertisersRepository.findOne({ where: { userId: user.id } }).catch(() => null)
    const listingAdvertiser = await this.advertisersRepository.findOne({ where: { id: listing.advertiserId }, relations: ['user'] }).catch(() => null)
    const isOwner =
      (myAdvertiser && listing.advertiserId === myAdvertiser.id) ||
      ((listingAdvertiser as any)?.userId === user.id) ||
      ((listingAdvertiser as any)?.user?.telegramId === user.telegramId)
    if (!isOwner) {
      throw new ForbiddenException('You can only update your own listings');
    }

    Object.assign(listing, updateListingDto);
    await this.listingsRepository.save(listing);

    return this.formatListing(listing);
  }

  async remove(id: string, user: User) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['advertiser'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Ownership check (supports legacy records)
    const myAdvertiser = await this.advertisersRepository.findOne({ where: { userId: user.id } }).catch(() => null)
    const listingAdvertiser = await this.advertisersRepository.findOne({ where: { id: listing.advertiserId }, relations: ['user'] }).catch(() => null)
    const isOwner =
      (myAdvertiser && listing.advertiserId === myAdvertiser.id) ||
      ((listingAdvertiser as any)?.userId === user.id) ||
      ((listingAdvertiser as any)?.user?.telegramId === user.telegramId)
    if (!isOwner) {
      throw new ForbiddenException('You can only delete your own listings');
    }

    const manager = this.listingsRepository.manager;

    // Защита: нельзя удалять объявление с активной безопасной сделкой (деньги в эскроу)
    try {
      const active = await manager.query(
        `SELECT 1 FROM safe_deals
         WHERE ("listingId" = $1 OR "responseId" IN (SELECT id FROM responses WHERE "listingId" = $1))
           AND status IN ('funded','in_progress','delivered','disputed')
         LIMIT 1`,
        [id],
      );
      if (Array.isArray(active) && active.length > 0) {
        throw new BadRequestException(
          'Нельзя удалить объявление с активной безопасной сделкой. Сначала завершите сделку или верните средства.',
        );
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      // Таблицы может не быть — значит активных сделок нет, продолжаем удаление
    }

    // Удаляем зависимые данные в правильном порядке, чтобы не упереться в внешние ключи.
    const runQuiet = async (sql: string) => {
      try {
        await manager.query(sql, [id]);
      } catch (err: any) {
        this.logger.warn(`remove cleanup skipped: ${err?.message}`);
      }
    };
    // 1) Сообщения чата привязаны к откликам (FK messages.responseId → responses.id)
    await runQuiet(
      `DELETE FROM messages WHERE "responseId" IN (SELECT id FROM responses WHERE "listingId" = $1)`,
    );
    // 2) Безопасные сделки этого объявления/его откликов (осиротевшие после удаления)
    await runQuiet(
      `DELETE FROM safe_deals WHERE "listingId" = $1 OR "responseId" IN (SELECT id FROM responses WHERE "listingId" = $1)`,
    );
    // 3) Сами отклики
    await manager.query(`DELETE FROM responses WHERE "listingId" = $1`, [id]);

    await this.listingsRepository.remove(listing);
    return { success: true };
  }

  async updateStatus(id: string, status: ListingStatus, user: User) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['advertiser'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Ownership check (supports legacy records)
    const myAdvertiser = await this.advertisersRepository.findOne({ where: { userId: user.id } }).catch(() => null)
    const listingAdvertiser = await this.advertisersRepository.findOne({ where: { id: listing.advertiserId }, relations: ['user'] }).catch(() => null)
    const isOwner =
      (myAdvertiser && listing.advertiserId === myAdvertiser.id) ||
      ((listingAdvertiser as any)?.userId === user.id) ||
      ((listingAdvertiser as any)?.user?.telegramId === user.telegramId)
    if (!isOwner) {
      throw new ForbiddenException('You can only update your own listings');
    }

    listing.status = status;
    await this.listingsRepository.save(listing);

    return this.formatListing(listing);
  }

  private formatListing(listing: Listing) {
    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      advertiserId: listing.advertiserId,
      advertiser: {
        id: listing.advertiser.id,
        userId: (listing.advertiser as any).userId,
        companyName: (listing.advertiser as any).companyName || ((listing.advertiser as any).firstName + ' ' + ((listing.advertiser as any).lastName || '')),
        isVerified: (listing.advertiser as any).isVerified,
        user: (listing.advertiser as any).user ? {
          id: (listing.advertiser as any).user.id,
          telegramId: (listing.advertiser as any).user.telegramId,
          firstName: (listing.advertiser as any).user.firstName,
          lastName: (listing.advertiser as any).user.lastName,
        } : undefined,
      },
      targetCategories: listing.targetCategories || [],
      budget: listing.budget,
      format: listing.format,
      requirements: listing.requirements || {},
      deadline: listing.deadline,
      status: listing.status,
      viewsCount: listing.viewsCount,
      responsesCount: listing.responsesCount,
      useSafeDeal: !!listing.useSafeDeal,
      createdAt: listing.createdAt,
    };
  }
}














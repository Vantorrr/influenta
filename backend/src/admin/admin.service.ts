import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing, ListingStatus } from '../listings/entities/listing.entity';
import { Response as ListingResponse } from '../responses/entities/response.entity';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { UpdateBloggerAdminDto } from './dto/update-blogger-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Blogger) private readonly bloggersRepository: Repository<Blogger>,
    @InjectRepository(Advertiser) private readonly advertisersRepository: Repository<Advertiser>,
    @InjectRepository(Listing) private readonly listingsRepository: Repository<Listing>,
    @InjectRepository(ListingResponse) private readonly responsesRepository: Repository<ListingResponse>,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  async getPlatformStats() {
    const now = new Date();
    const day1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const day7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const moscowOffsetMs = 3 * 60 * 60 * 1000;
    const moscowShifted = new Date(now.getTime() + moscowOffsetMs);
    moscowShifted.setUTCHours(0, 0, 0, 0);
    const dayStartMoscow = new Date(moscowShifted.getTime() - moscowOffsetMs);

    const [
      totalUsers,
      activeUsers,
      onboardedUsers,
      totalBloggers,
      totalAdvertisers,
      verifiedUsers,
      newToday,
      newUsersLast24h,
      newUsersWeek,
      newUsersMonth,
      activeToday,
      activeListings,
      totalListings,
      newListingsWeek,
      totalResponses,
      responsesWeek,
      totalMessages,
      messagesWeek,
      totalOffers,
      offersWeek,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({ where: { isActive: true, onboardingCompleted: true } }),
      this.usersRepository.count({ where: { role: 'blogger' as any, isActive: true } }),
      this.usersRepository.count({ where: { role: 'advertiser' as any, isActive: true } }),
      this.usersRepository.count({ where: { isVerified: true } }),
      this.usersRepository.createQueryBuilder('u').where('u.createdAt >= :d', { d: dayStartMoscow }).getCount().catch(() => 0),
      this.usersRepository.createQueryBuilder('u').where('u.createdAt > :d', { d: day1 }).getCount().catch(() => 0),
      this.usersRepository.createQueryBuilder('u').where('u.createdAt > :d', { d: day7 }).getCount().catch(() => 0),
      this.usersRepository.createQueryBuilder('u').where('u.createdAt > :d', { d: day30 }).getCount().catch(() => 0),
      this.usersRepository.query(
        'SELECT COUNT(*)::int AS count FROM users WHERE COALESCE("lastLoginAt", "createdAt") >= $1',
        [dayStartMoscow],
      ).then(r => parseInt(r[0]?.count ?? '0', 10)).catch(() => 0),
      this.listingsRepository.count({ where: { status: ListingStatus.ACTIVE } }).catch(() => 0),
      this.listingsRepository.count().catch(() => 0),
      this.listingsRepository.createQueryBuilder('l').where('l.createdAt > :d', { d: day7 }).getCount().catch(() => 0),
      this.responsesRepository.count().catch(() => 0),
      this.responsesRepository.createQueryBuilder('r').where('r.createdAt > :d', { d: day7 }).getCount().catch(() => 0),
      // messages и offers через raw query чтобы не тащить лишние репозитории
      this.usersRepository.query('SELECT COUNT(*) FROM messages').then(r => parseInt(r[0].count)).catch(() => 0),
      this.usersRepository.query('SELECT COUNT(*) FROM messages WHERE "createdAt" > $1', [day7]).then(r => parseInt(r[0].count)).catch(() => 0),
      this.usersRepository.query('SELECT COUNT(*) FROM offers').then(r => parseInt(r[0].count)).catch(() => 0),
      this.usersRepository.query('SELECT COUNT(*) FROM offers WHERE "createdAt" > $1', [day7]).then(r => parseInt(r[0].count)).catch(() => 0),
    ]);

    const userGrowth = totalUsers > 0 ? Math.round((newUsersWeek / totalUsers) * 100) : 0;
    const listingGrowth = activeListings > 0 ? Math.round((newListingsWeek / activeListings) * 100) : 0;
    const verificationRate = totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;
    const onboardingRate = activeUsers > 0 ? Math.round((onboardedUsers / activeUsers) * 100) : 0;

    return {
      // Пользователи
      totalUsers,
      activeUsers,
      onboardedUsers,
      onboardingRate,
      totalBloggers,
      totalAdvertisers,
      verifiedUsers,
      verificationRate,
      // Прирост
      newToday,
      newUsersLast24h,
      newUsersWeek,
      newUsersMonth,
      activeToday,
      userGrowth,
      // Объявления
      totalListings,
      activeListings,
      newListingsWeek,
      listingGrowth,
      // Активность
      totalResponses,
      responsesWeek,
      totalMessages,
      messagesWeek,
      totalOffers,
      offersWeek,
      platformCommission: this.configService.get('app.platform.commission') ?? 0,
    };
  }

  async getAdminsList() {
    const adminTelegramIds = this.configService.get<number[]>('app.admins.telegramIds') ?? [];
    const adminEmails = this.configService.get<string[]>('app.admins.emails') ?? [];

    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .where(adminTelegramIds.length > 0 ? 'user.telegramId IN (:...ids)' : '1=0', { ids: adminTelegramIds.map(String) })
      .orWhere(adminEmails.length > 0 ? 'user.email IN (:...emails)' : '1=0', { emails: adminEmails })
      .orWhere('user.role = :role', { role: 'admin' })
      .getMany();

    return admins.map((a, i) => ({ ...a, adminNumber: i + 1 }));
  }

  async getVerificationRequests() {
    const users = await this.usersRepository.find({
      where: { verificationRequested: true, isVerified: false },
      order: { verificationRequestedAt: 'DESC' },
    });
    return users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      requestedAt: u.verificationRequestedAt,
      subscribersCount: (u as any).subscribersCount,
      bio: u.bio,
      verificationData: u.verificationData,
    }));
  }

  async verifyUser(id: string) {
    await this.usersRepository.update(id, { isVerified: true, verificationRequested: false });
    // Уведомление пользователю
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (user?.telegramId) {
        await this.telegramService.sendMessage(
          parseInt(String(user.telegramId), 10),
          '✅ Ваша верификация одобрена. Спасибо!'
        );
      }
    } catch {}
    return { success: true };
  }

  async rejectVerification(id: string, reason: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.verificationRequested = false;
    user.verificationData = { ...(user.verificationData || {}), rejectionReason: reason };
    await this.usersRepository.save(user);
    // Уведомление пользователю
    try {
      if (user?.telegramId) {
        await this.telegramService.sendMessage(
          parseInt(String(user.telegramId), 10),
          `❌ Верификация отклонена. Причина: ${reason}`
        );
      }
    } catch {}
    return { success: true };
  }

  async unverifyUser(id: string, reason: string) {
    await this.usersRepository.update(id, { isVerified: false });
    // Уведомления: пользователю и админам
    try {
      const user = await this.usersRepository.findOne({ where: { id } });
      if (user?.telegramId) {
        await this.telegramService.sendMessage(
          parseInt(String(user.telegramId), 10),
          `ℹ️ Верификация снята администратором. Причина: ${reason}`
        );
      }
      // Сообщить всем админам
      const admins = await this.getAdminsList();
      for (const admin of admins) {
        if (admin.telegramId) {
          await this.telegramService.sendMessage(
            parseInt(String(admin.telegramId), 10),
            `👮 Снята верификация у @${user?.username || user?.firstName}. Причина: ${reason}`
          );
        }
      }
    } catch {}
    return { success: true };
  }

  async toggleUserBlock(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const isActive = !user.isActive;
    await this.usersRepository.update(id, { isActive });
    return { success: true, isActive };
  }

  async softDeleteUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    await this.usersRepository.update(id, { isActive: false });
    return { success: true };
  }

  async deleteListing(id: string, reason: string) {
    await this.listingsRepository
      .createQueryBuilder()
      .update(Listing)
      .set({ status: ListingStatus.CLOSED, additionalInfo: () => `'${JSON.stringify({ closedReason: reason, closedAt: new Date().toISOString() })}'` })
      .where('id = :id', { id })
      .execute();
    return { success: true };
  }

  async getRevenueStats() {
    return {
      totalRevenue: 0,
      platformCommission: 0,
      monthlyGrowth: 0,
      topSpenders: [],
    };
  }

  async getSystemInfo() {
    return {
      version: '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime(),
    };
  }

  async broadcastMaintenance(message?: string) {
    // Fire-and-forget: start broadcast in background, return immediately
    this.telegramService.broadcastMaintenance(message)
      .then(result => {
        console.log('✅ Broadcast completed:', result);
      })
      .catch(e => {
        console.error('❌ Broadcast failed:', e?.message);
      });

    return { ok: true, message: 'Рассылка запущена в фоновом режиме' };
  }

  async getAdvertisersList() {
    try {
      const [advertisers, listingCounts] = await Promise.all([
        this.advertisersRepository.find({ relations: ['user'] }).catch(() => []),
        this.listingsRepository
          .createQueryBuilder('listing')
          .select('listing.advertiserId', 'advertiserId')
          .addSelect('COUNT(*)', 'count')
          .groupBy('listing.advertiserId')
          .getRawMany()
          .catch(() => []),
      ]);

      // Если таблицы advertisers нет, используем пользователей с ролью advertiser
      const baseAdvertisers = advertisers.length
        ? advertisers.map((a) => ({
            id: a.id,
            userId: (a as any).user?.id ?? null,
            companyName: a.companyName,
            website: a.website,
            isVerified: a.isVerified,
            totalSpent: Number((a as any).totalSpent ?? 0),
            createdAt: a.createdAt,
            updatedAt: (a as any).updatedAt,
            email: (a as any).user?.email ?? null,
            lastLoginAt: (a as any).user?.lastLoginAt ?? (a as any).updatedAt,
          }))
        : (
            await this.usersRepository.find({ where: { role: 'advertiser' as any } })
          ).map((u) => ({
            id: u.id,
            userId: u.id,
            companyName: u.companyName || `${u.firstName} ${u.lastName || ''}`.trim(),
            website: u.website || null,
            isVerified: u.isVerified,
            totalSpent: 0,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            email: u.email || null,
            lastLoginAt: u.lastLoginAt || u.updatedAt,
          }));

      const idToActive = new Map<string, number>();
      for (const row of listingCounts) idToActive.set(String(row.advertiserId), parseInt(row.count, 10));

      return baseAdvertisers.map((a) => ({
        id: a.id,
        userId: a.userId ?? a.id,
        companyName: a.companyName,
        website: a.website,
        isVerified: a.isVerified,
        totalSpent: a.totalSpent ?? 0,
        activeListings: idToActive.get(String(a.id)) ?? 0,
        createdAt: a.createdAt,
        lastActivity: a.lastLoginAt ?? a.updatedAt,
        email: a.email ?? null,
      }));
    } catch (e) {
      // Никогда не валим админку — лучше пустой список
      return [];
    }
  }

  async getRecentActivity() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [latestUsers, latestListings, latestVerifs] = await Promise.all([
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :d', { d: sevenDaysAgo })
        .orderBy('u.createdAt', 'DESC')
        .limit(5)
        .getMany(),
      this.listingsRepository
        .createQueryBuilder('l')
        .leftJoinAndSelect('l.advertiser', 'advertiser')
        .where('l.createdAt >= :d', { d: sevenDaysAgo })
        .orderBy('l.createdAt', 'DESC')
        .limit(5)
        .getMany(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.verificationRequested = true')
        .andWhere('COALESCE(u.verificationRequestedAt, u.updatedAt) >= :d', { d: sevenDaysAgo })
        .orderBy('u.verificationRequestedAt', 'DESC')
        .limit(5)
        .getMany(),
    ]);

    const items: any[] = [];
    for (const u of latestUsers) items.push({ id: `u_${u.id}`, type: 'new_user', title: `Новый пользователь: @${u.username ?? u.firstName}`, time: u.createdAt, status: u.role });
    for (const l of latestListings) items.push({ id: `l_${l.id}`, type: 'new_listing', title: `Новое объявление: "${l.title}"`, time: l.createdAt, status: 'listing', amount: Number(l.budget ?? 0) });
    for (const v of latestVerifs) items.push({ id: `v_${v.id}`, type: 'verification', title: `Запрос на верификацию: ${v.firstName}${v.lastName ? ' ' + v.lastName : ''}`, time: v.verificationRequestedAt ?? v.updatedAt, status: 'pending' });
    return items.sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 10);
  }

  async getTopBloggers() {
    // subscribersCount хранится в users, не все блогеры имеют строку в таблице bloggers
    const rows = await this.usersRepository.query(`
      SELECT
        u.id,
        u."firstName",
        u."lastName",
        u.username,
        u."subscribersCount",
        COALESCE(
          (SELECT COUNT(r.id) FROM responses r
           JOIN bloggers b ON r."bloggerId" = b.id
           WHERE b."userId" = u.id AND r.status = 'accepted'),
          0
        ) AS campaigns
      FROM users u
      WHERE u."isActive" = true
        AND u."onboardingCompleted" = true
        AND u.role = 'blogger'
        AND u."subscribersCount" IS NOT NULL
        AND u."subscribersCount" > 0
      ORDER BY u."subscribersCount" DESC
      LIMIT 5
    `);

    return rows.map((row: any, i: number) => ({
      id: row.id,
      name: `${row.firstName || ''}${row.lastName ? ' ' + row.lastName : ''}`.trim(),
      username: row.username ? `@${row.username}` : '',
      subscribers: Number(row.subscribersCount || 0),
      earnings: 0,
      campaigns: Number(row.campaigns || 0),
      rank: i + 1,
    }));
  }

  // Admin: list all listings with basic info and counters
  async getListingsAdmin() {
    const listings = await this.listingsRepository.find({
      relations: ['advertiser', 'advertiser.user'],
      order: { createdAt: 'DESC' },
    });

    return listings.map((l) => ({
      id: l.id,
      title: l.title,
      description: l.description,
      format: l.format,
      budget: Number(l.budget ?? 0),
      status: l.status,
      createdAt: l.createdAt,
      viewsCount: l.viewsCount ?? 0,
      responsesCount: l.responsesCount ?? 0,
      advertiser: l.advertiser
        ? {
            id: l.advertiser.id,
            userId: (l.advertiser as any).userId,
            companyName:
              (l.advertiser as any).companyName ||
              `${(l.advertiser as any).user?.firstName || ''} ${
                (l.advertiser as any).user?.lastName || ''
              }`.trim(),
            user: (l.advertiser as any).user
              ? {
                  id: (l.advertiser as any).user.id,
                  telegramId: (l.advertiser as any).user.telegramId,
                  username: (l.advertiser as any).user.username,
                }
              : undefined,
          }
        : undefined,
    }));
  }

  // Admin: listing details with responses
  async getListingDetailAdmin(id: string) {
    const listing = await this.listingsRepository.findOne({
      where: { id },
      relations: ['advertiser', 'advertiser.user'],
    });
    if (!listing) throw new NotFoundException('Listing not found');

    const responses = await this.responsesRepository.find({
      where: { listingId: id } as any,
      relations: ['blogger', 'blogger.user'],
      order: { createdAt: 'DESC' as any },
    });

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      format: listing.format,
      budget: Number(listing.budget ?? 0),
      status: listing.status,
      createdAt: listing.createdAt,
      requirements: listing.requirements || {},
      viewsCount: listing.viewsCount ?? 0,
      responsesCount: listing.responsesCount ?? responses.length,
      advertiser: listing.advertiser
        ? {
            id: listing.advertiser.id,
            userId: (listing.advertiser as any).userId,
            companyName:
              (listing.advertiser as any).companyName ||
              `${(listing.advertiser as any).user?.firstName || ''} ${
                (listing.advertiser as any).user?.lastName || ''
              }`.trim(),
            user: (listing.advertiser as any).user
              ? {
                  id: (listing.advertiser as any).user.id,
                  telegramId: (listing.advertiser as any).user.telegramId,
                  username: (listing.advertiser as any).user.username,
                }
              : undefined,
          }
        : undefined,
      responses: responses.map((r) => ({
        id: r.id,
        message: r.message,
        proposedPrice: Number(r.proposedPrice ?? 0),
        status: r.status,
        createdAt: r.createdAt,
        blogger: r.blogger
          ? {
              id: r.blogger.id,
              userId: (r.blogger as any).userId,
              user: (r.blogger as any).user
                ? {
                    id: (r.blogger as any).user.id,
                    telegramId: (r.blogger as any).user.telegramId,
                    username: (r.blogger as any).user.username,
                    firstName: (r.blogger as any).user.firstName,
                    lastName: (r.blogger as any).user.lastName,
                  }
                : undefined,
            }
          : undefined,
      })),
    };
  }

  async syncListingCounters() {
    // Пересчитываем responsesCount для всех объявлений
    const listings = await this.listingsRepository.find();
    for (const listing of listings) {
      const count = await this.listingsRepository
        .createQueryBuilder('l')
        .leftJoin('responses', 'r', 'r.listingId = l.id')
        .where('l.id = :id', { id: listing.id })
        .select('COUNT(r.id)', 'count')
        .getRawOne();
      listing.responsesCount = parseInt(count?.count || '0', 10);
    }
    await this.listingsRepository.save(listings);
    return { success: true, updated: listings.length };
  }

  async fixReelsToLive() {
    // 1) Гарантируем наличие значений в postgres enum listings_format_enum
    await this.listingsRepository.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_format_enum' AND e.enumlabel = 'live'
        ) THEN
          ALTER TYPE listings_format_enum ADD VALUE 'live';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_format_enum' AND e.enumlabel = 'post_and_story'
        ) THEN
          ALTER TYPE listings_format_enum ADD VALUE 'post_and_story';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_format_enum' AND e.enumlabel = 'any'
        ) THEN
          ALTER TYPE listings_format_enum ADD VALUE 'any';
        END IF;
      END $$;
    `);

    // 2) Обновляем старые данные: reels/reel -> live
    await this.listingsRepository.query(`UPDATE listings SET format = 'live' WHERE format IN ('reels','reel');`);

    return { success: true };
  }

  // Ensure all BloggerCategory enum values exist in Postgres enum listings_targetcategories_enum
  async fixTargetCategoriesEnum() {
    await this.listingsRepository.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'humor'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'humor';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'food'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'food';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'fitness'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'fitness';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'education'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'education';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'gaming'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'gaming';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'tech'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'tech';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'fashion'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'fashion';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'lifestyle'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'lifestyle';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'beauty'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'beauty';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'business'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'business';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'hobby'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'hobby';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'travel'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'travel';
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum e
          JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'listings_targetcategories_enum' AND e.enumlabel = 'other'
        ) THEN
          ALTER TYPE listings_targetcategories_enum ADD VALUE 'other';
        END IF;
      END $$;
    `);
    return { success: true };
  }

  async updateBlogger(id: string, dto: UpdateBloggerAdminDto) {
    let blogger = await this.bloggersRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!blogger) {
      blogger = await this.bloggersRepository.findOne({
        where: { userId: id },
        relations: ['user'],
      });
    }

    if (!blogger) {
      // Если записи в bloggers нет, но юзер есть - создадим её
      const user = await this.usersRepository.findOne({ where: { id } });
      if (user && user.role === 'blogger') {
        blogger = this.bloggersRepository.create({
          userId: user.id,
          user: user,
          categories: [],
          postExamples: [],
          isFeatured: false,
          subscribersCount: 0,
          averageViews: 0,
          pricePerPost: 0,
          isPublic: true,
        });
        await this.bloggersRepository.save(blogger);
      } else {
        throw new NotFoundException('Blogger not found');
      }
    }

    // Update Blogger fields
    if (dto.bio !== undefined) blogger.bio = dto.bio;
    if (dto.pricePerPost !== undefined) blogger.pricePerPost = dto.pricePerPost;
    if (dto.pricePerStory !== undefined) blogger.pricePerStory = dto.pricePerStory;
    if (dto.categories !== undefined) blogger.categories = dto.categories;
    if (dto.adminNotes !== undefined) blogger.adminNotes = dto.adminNotes;
    if (dto.isFeatured !== undefined) blogger.isFeatured = dto.isFeatured;

    await this.bloggersRepository.save(blogger);

    // Update User fields
    if (blogger.user && (dto.firstName !== undefined || dto.lastName !== undefined)) {
      if (dto.firstName !== undefined) blogger.user.firstName = dto.firstName;
      if (dto.lastName !== undefined) blogger.user.lastName = dto.lastName;
      await this.usersRepository.save(blogger.user);
    }

    return blogger;
  }
}



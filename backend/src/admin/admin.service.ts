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
    const [totalUsers, totalBloggers, totalAdvertisers, activeListings, verifiedUsers] = await Promise.all([
      this.usersRepository.count(),
      this.bloggersRepository.count().catch(() => 0),
      this.advertisersRepository.count().catch(() => 0),
      this.listingsRepository.count({ where: { status: ListingStatus.ACTIVE } }).catch(() => 0),
      this.usersRepository.count({ where: { isVerified: true } }),
    ]);

    return {
      totalUsers,
      totalBloggers,
      totalAdvertisers,
      activeListings,
      verifiedUsers,
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
      order: { verificationRequestedAt: 'ASC' },
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

  async unverifyUser(id: string) {
    await this.usersRepository.update(id, { isVerified: false });
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
            rating: Number((a as any).rating ?? 0),
            completedCampaigns: Number((a as any).completedCampaigns ?? 0),
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
            rating: 0,
            completedCampaigns: 0,
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
        rating: a.rating ?? 0,
        completedCampaigns: a.completedCampaigns ?? 0,
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
    const [latestUsers, latestListings, latestVerifs] = await Promise.all([
      this.usersRepository.find({ order: { createdAt: 'DESC' }, take: 5 }),
      this.listingsRepository.find({ order: { createdAt: 'DESC' }, take: 5, relations: ['advertiser'] }),
      this.usersRepository.find({ where: { verificationRequested: true }, order: { verificationRequestedAt: 'DESC' }, take: 5 }),
    ]);

    const items: any[] = [];
    for (const u of latestUsers) items.push({ id: `u_${u.id}`, type: 'new_user', title: `Новый пользователь: @${u.username ?? u.firstName}`, time: u.createdAt, status: u.role });
    for (const l of latestListings) items.push({ id: `l_${l.id}`, type: 'new_listing', title: `Новое объявление: "${l.title}"`, time: l.createdAt, status: 'listing', amount: Number(l.budget ?? 0) });
    for (const v of latestVerifs) items.push({ id: `v_${v.id}`, type: 'verification', title: `Запрос на верификацию: ${v.firstName}${v.lastName ? ' ' + v.lastName : ''}`, time: v.verificationRequestedAt ?? v.updatedAt, status: 'pending' });
    return items.sort((a, b) => +new Date(b.time) - +new Date(a.time)).slice(0, 10);
  }

  async getTopBloggers() {
    const bloggers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.isActive = :isActive', { isActive: true })
      .orderBy('user.subscribersCount', 'DESC')
      .limit(5)
      .getMany();
    return bloggers.map((u, i) => ({
      id: u.id,
      name: `${u.firstName}${u.lastName ? ' ' + u.lastName : ''}`.trim(),
      username: u.username ? `@${u.username}` : '',
      subscribers: Number(u.subscribersCount || 0),
      earnings: 0,
      campaigns: 0,
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
}

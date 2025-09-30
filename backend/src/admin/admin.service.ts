import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing, ListingStatus } from '../listings/entities/listing.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Blogger) private readonly bloggersRepository: Repository<Blogger>,
    @InjectRepository(Advertiser) private readonly advertisersRepository: Repository<Advertiser>,
    @InjectRepository(Listing) private readonly listingsRepository: Repository<Listing>,
    private readonly configService: ConfigService,
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
    return { success: true };
  }

  async rejectVerification(id: string, reason: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.verificationRequested = false;
    user.verificationData = { ...(user.verificationData || {}), rejectionReason: reason };
    await this.usersRepository.save(user);
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
}


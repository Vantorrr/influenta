import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing, ListingStatus } from '../listings/entities/listing.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Blogger)
    private bloggersRepository: Repository<Blogger>,
    @InjectRepository(Advertiser)
    private advertisersRepository: Repository<Advertiser>,
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    private configService: ConfigService,
  ) {}

  async getPlatformStats() {
    const [
      totalUsers,
      totalBloggers,
      totalAdvertisers,
      activeListings,
      verifiedUsers,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.bloggersRepository.count(),
      this.advertisersRepository.count(),
      this.listingsRepository.count({ where: { status: ListingStatus.ACTIVE } }),
      this.usersRepository.count({ where: { isVerified: true } }),
    ]);

    return {
      totalUsers,
      totalBloggers,
      totalAdvertisers,
      activeListings,
      verifiedUsers,
      platformCommission: this.configService.get('app.platform.commission'),
    };
  }

  async getAdminsList() {
    const adminTelegramIds = this.configService.get<number[]>('app.admins.telegramIds') ?? [];
    const adminEmails = this.configService.get<string[]>('app.admins.emails') ?? [];

    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .where(adminTelegramIds.length > 0 ? 'user.telegramId IN (:...ids)' : '1=0', {
        ids: adminTelegramIds.map(String),
      })
      .orWhere('user.email IN (:...emails)', { emails: adminEmails })
      .orWhere('user.role = :role', { role: 'admin' })
      .getMany();

    return admins.map((admin, index) => ({
      ...admin,
      adminLevel: adminTelegramIds.includes(parseInt(String(admin.telegramId)))
        ? adminTelegramIds.indexOf(parseInt(String(admin.telegramId))) === 0
          ? 'super_admin' 
          : 'admin'
        : 'admin',
      adminNumber: index + 1,
    }));
  }

  async getVerificationRequests() {
    const requests = await this.usersRepository.find({
      where: {
        verificationRequested: true,
        isVerified: false
      },
      order: {
        verificationRequestedAt: 'ASC'
      }
    });

    return requests.map(user => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      requestedAt: user.verificationRequestedAt,
      subscribersCount: (user as any).subscribersCount,
      bio: user.bio,
      verificationData: user.verificationData
    }));
  }

  async verifyUser(userId: string) {
    await this.usersRepository.update(userId, { 
      isVerified: true,
      verificationRequested: false 
    });
    return { success: true, message: 'User verified successfully' };
  }

  async rejectVerification(userId: string, reason: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    user.verificationRequested = false;
    user.verificationData = {
      ...user.verificationData,
      rejectionReason: reason
    };
    await this.usersRepository.save(user);
    
    return { success: true, message: 'Verification rejected' };
  }

  async toggleUserBlock(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const newStatus = !user.isActive;
    await this.usersRepository.update(userId, { isActive: newStatus });
    
    return { 
      success: true, 
      message: `User ${newStatus ? 'unblocked' : 'blocked'} successfully`,
      isActive: newStatus 
    };
  }

  async deleteListing(listingId: string, reason: string) {
    await this.listingsRepository
      .createQueryBuilder()
      .update(Listing)
      .set({
        status: ListingStatus.CLOSED,
        additionalInfo: () => `'${JSON.stringify({ closedReason: reason, closedAt: new Date().toISOString() })}'`,
      })
      .where('id = :id', { id: listingId })
      .execute();

    return { success: true, message: 'Listing closed successfully' };
  }

  async getRevenueStats() {
    // В реальном приложении здесь будет расчет на основе транзакций
    const mockStats = {
      totalRevenue: 12500000,
      platformCommission: 1250000,
      monthlyGrowth: 23.5,
      topSpenders: [
        { company: 'TechBrand', spent: 2500000 },
        { company: 'BeautyWorld', spent: 3800000 },
        { company: 'FoodDelivery Pro', spent: 980000 },
      ],
    };
    
    return mockStats;
  }

  async getAdvertisersList() {
    const [advertisers, listingCounts] = await Promise.all([
      this.advertisersRepository.find({ relations: ['user'] }),
      this.listingsRepository
        .createQueryBuilder('listing')
        .select('listing.advertiserId', 'advertiserId')
        .addSelect('COUNT(*)', 'count')
        .groupBy('listing.advertiserId')
        .getRawMany(),
    ]);

    const advertiserIdToActiveListings = new Map<string, number>();
    for (const row of listingCounts) {
      advertiserIdToActiveListings.set(String(row.advertiserId), parseInt(row.count, 10));
    }

    return advertisers.map((a) => ({
      id: a.id,
      companyName: a.companyName,
      website: a.website,
      isVerified: a.isVerified,
      rating: Number(a.rating ?? 0),
      completedCampaigns: Number(a.completedCampaigns ?? 0),
      totalSpent: Number(a.totalSpent ?? 0),
      activeListings: advertiserIdToActiveListings.get(String(a.id)) ?? 0,
      createdAt: a.createdAt,
      lastActivity: a.user?.lastLoginAt ?? a.updatedAt,
      email: a.user?.email ?? null,
    }));
  }

  async getSystemInfo() {
    const dbSize = await this.usersRepository.query(
      "SELECT pg_database_size(current_database()) as size"
    );

    return {
      version: '1.0.0',
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      databaseSize: parseInt(dbSize[0].size),
      environment: this.configService.get('app.nodeEnv'),
      adminIds: this.configService.get<number[]>('app.admins.telegramIds'),
    };
  }
}



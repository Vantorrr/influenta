import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { Blogger } from '../bloggers/entities/blogger.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing } from '../listings/entities/listing.entity';

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
      this.listingsRepository.count({ where: { status: 'active' } }),
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
    const adminTelegramIds = this.configService.get<number[]>('app.admins.telegramIds');
    const adminEmails = this.configService.get<string[]>('app.admins.emails');

    const admins = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.telegramId IN (:...ids)', { ids: adminTelegramIds.map(String) })
      .orWhere('user.email IN (:...emails)', { emails: adminEmails })
      .orWhere('user.role = :role', { role: 'admin' })
      .getMany();

    return admins.map((admin, index) => ({
      ...admin,
      adminLevel: adminTelegramIds.includes(parseInt(admin.telegramId)) 
        ? adminTelegramIds.indexOf(parseInt(admin.telegramId)) === 0 
          ? 'super_admin' 
          : 'admin'
        : 'admin',
      adminNumber: index + 1,
    }));
  }

  async verifyUser(userId: string) {
    await this.usersRepository.update(userId, { isVerified: true });
    return { success: true, message: 'User verified successfully' };
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
    await this.listingsRepository.update(listingId, { 
      status: 'closed',
      additionalInfo: { closedReason: reason, closedAt: new Date() }
    });
    
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


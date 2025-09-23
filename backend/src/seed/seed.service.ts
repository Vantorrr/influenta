import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '@/users/entities/user.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { Listing, ListingStatus, PostFormat } from '@/listings/entities/listing.entity';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Advertiser) private readonly advertisers: Repository<Advertiser>,
    @InjectRepository(Listing) private readonly listings: Repository<Listing>,
  ) {}

  async runSeed(key: string | undefined) {
    const expected = process.env.SEED_KEY;
    if (!expected || key !== expected) {
      throw new ForbiddenException('Invalid seed key');
    }

    // Blogger user
    let blogger = await this.users.findOne({ where: { telegramId: '10001' } });
    if (!blogger) {
      blogger = this.users.create({
        telegramId: '10001',
        firstName: 'Анна',
        lastName: 'Иванова',
        username: 'anna_lifestyle',
        role: UserRole.BLOGGER,
        isActive: true,
        isVerified: true,
      });
      await this.users.save(blogger);
    }

    // Advertiser user
    let advUser = await this.users.findOne({ where: { telegramId: '20001' } });
    if (!advUser) {
      advUser = this.users.create({
        telegramId: '20001',
        firstName: 'Tech',
        lastName: 'Brand',
        username: 'techbrand',
        role: UserRole.ADVERTISER,
        isActive: true,
        isVerified: true,
      });
      await this.users.save(advUser);
    }

    // Advertiser profile
    let advertiser = await this.advertisers.findOne({ where: { userId: advUser.id } });
    if (!advertiser) {
      advertiser = this.advertisers.create({
        user: advUser,
        userId: advUser.id,
        companyName: 'TechBrand',
        description: 'Технологический бренд',
        website: 'https://example.com',
        isVerified: true,
      });
      await this.advertisers.save(advertiser);
    }

    // Listing
    const anyListing = await this.listings.findOne({ where: { advertiserId: advertiser.id } });
    if (!anyListing) {
      const listing = this.listings.create({
        advertiser,
        advertiserId: advertiser.id,
        title: 'Реклама мобильного приложения',
        description: 'Ищем блогеров wellness/tech',
        targetCategories: [],
        budget: 150000,
        format: PostFormat.ANY,
        status: ListingStatus.ACTIVE,
        viewsCount: 0,
        responsesCount: 0,
      });
      await this.listings.save(listing);
    }

    return { success: true };
  }
}



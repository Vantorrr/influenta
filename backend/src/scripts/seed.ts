import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Advertiser } from '../advertisers/entities/advertiser.entity';
import { Listing, ListingStatus, PostFormat } from '../listings/entities/listing.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const dataSource = app.get(DataSource);

  const userRepo = dataSource.getRepository(User);
  const advRepo = dataSource.getRepository(Advertiser);
  const listingRepo = dataSource.getRepository(Listing);

  // Create blogger
  let blogger = await userRepo.findOne({ where: { telegramId: '10001' } });
  if (!blogger) {
    blogger = userRepo.create({
      telegramId: '10001',
      firstName: 'Анна',
      lastName: 'Иванова',
      username: 'anna_lifestyle',
      role: UserRole.BLOGGER,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(blogger);
  }

  // Create advertiser user + profile
  let advertiserUser = await userRepo.findOne({ where: { telegramId: '20001' } });
  if (!advertiserUser) {
    advertiserUser = userRepo.create({
      telegramId: '20001',
      firstName: 'Tech',
      lastName: 'Brand',
      username: 'techbrand',
      role: UserRole.ADVERTISER,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(advertiserUser);
  }

  let advertiser = await advRepo.findOne({ where: { userId: advertiserUser.id } });
  if (!advertiser) {
    advertiser = advRepo.create({
      user: advertiserUser,
      userId: advertiserUser.id,
      companyName: 'TechBrand',
      description: 'Технологический бренд',
      website: 'https://example.com',
      isVerified: true,
    });
    await advRepo.save(advertiser);
  }

  // Create listing
  const existing = await listingRepo.findOne({ where: { advertiserId: advertiser.id } });
  if (!existing) {
    const listing = listingRepo.create({
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
    await listingRepo.save(listing);
  }

  await app.close();
  console.log('Seed completed');
}

bootstrap().catch((e) => {
  console.error(e);
  process.exit(1);
});



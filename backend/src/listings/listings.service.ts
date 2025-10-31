import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
import { Advertiser } from '@/advertisers/entities/advertiser.entity';
import { User } from '@/users/entities/user.entity';
import { ListingSearchDto } from './dto/listing-search.dto';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { ListingStatus } from '@/types';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingsRepository: Repository<Listing>,
    @InjectRepository(Advertiser)
    private advertisersRepository: Repository<Advertiser>,
  ) {}

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
      createdAt: listing.createdAt,
    };
  }
}











import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from './entities/listing.entity';
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
  ) {}

  async search(searchDto: ListingSearchDto, paginationDto: PaginationDto) {
    const { search, status = ListingStatus.ACTIVE } = searchDto;
    const { page = 1, limit = 20 } = paginationDto;

    const query = this.listingsRepository
      .createQueryBuilder('listing')
      .leftJoinAndSelect('listing.advertiser', 'advertiser')
      .where('listing.status = :status', { status });

    // Поиск по названию или описанию
    if (search) {
      query.andWhere(
        '(listing.title ILIKE :search OR listing.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .orderBy('listing.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

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
      relations: ['advertiser'],
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Увеличиваем счетчик просмотров
    await this.listingsRepository.increment({ id }, 'viewsCount', 1);

    return this.formatListing(listing);
  }

  async create(createListingDto: CreateListingDto, user: User) {
    if (user.role !== 'advertiser') {
      throw new ForbiddenException('Only advertisers can create listings');
    }

    const listing = this.listingsRepository.create({
      ...createListingDto,
      advertiser: user,
      status: ListingStatus.ACTIVE,
      viewsCount: 0,
      responsesCount: 0,
    });

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

    if (listing.advertiser.id !== user.id) {
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

    if (listing.advertiser.id !== user.id) {
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

    if (listing.advertiser.id !== user.id) {
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
      advertiser: {
        id: listing.advertiser.id,
        companyName: listing.advertiser.firstName + ' ' + (listing.advertiser.lastName || ''),
        isVerified: listing.advertiser.isVerified,
        rating: 0, // TODO: Implement rating system
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

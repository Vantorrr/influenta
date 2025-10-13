import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { SocialPlatform } from './entities/social-platform.entity';
import { CreateSocialPlatformDto } from './dto/create-social-platform.dto';
import { UpdateSocialPlatformDto } from './dto/update-social-platform.dto';

@Injectable()
export class SocialPlatformsService {
  constructor(
    @InjectRepository(SocialPlatform)
    private readonly platformsRepository: Repository<SocialPlatform>,
  ) {}

  async create(userId: string, createDto: CreateSocialPlatformDto): Promise<SocialPlatform> {
    // Check if platform already exists for this user
    const existing = await this.platformsRepository.findOne({
      where: { userId, platform: createDto.platform },
    });

    if (existing) {
      throw new ConflictException(`You already have a ${createDto.platform} platform`);
    }

    // If setting as primary, unset other primary platforms
    if (createDto.isPrimary) {
      await this.platformsRepository.update(
        { userId },
        { isPrimary: false }
      );
    }

    const platform = this.platformsRepository.create({
      ...createDto,
      userId,
    });

    return this.platformsRepository.save(platform);
  }

  async findAll(userId: string): Promise<SocialPlatform[]> {
    return this.platformsRepository.find({
      where: { userId },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<SocialPlatform> {
    const platform = await this.platformsRepository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException('Platform not found');
    }

    if (platform.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return platform;
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateSocialPlatformDto
  ): Promise<SocialPlatform> {
    const platform = await this.findOne(id, userId);

    // If setting as primary, unset other primary platforms
    if (updateDto.isPrimary && !platform.isPrimary) {
      await this.platformsRepository.update(
        { userId, id: Not(id) },
        { isPrimary: false }
      );
    }

    Object.assign(platform, updateDto);
    return this.platformsRepository.save(platform);
  }

  async remove(id: string, userId: string): Promise<void> {
    const platform = await this.findOne(id, userId);
    await this.platformsRepository.remove(platform);
  }

  // Get all platforms for a specific user (public view)
  async getUserPlatforms(userId: string): Promise<SocialPlatform[]> {
    return this.platformsRepository.find({
      where: { userId, isActive: true },
      order: { isPrimary: 'DESC', subscribersCount: 'DESC' },
    });
  }

  // Upload statistics screenshot
  async addStatisticsScreenshot(
    id: string,
    userId: string,
    screenshotUrl: string
  ): Promise<SocialPlatform> {
    const platform = await this.findOne(id, userId);
    
    if (!platform.statisticsScreenshots) {
      platform.statisticsScreenshots = [];
    }
    
    platform.statisticsScreenshots.push(screenshotUrl);
    
    // Update lastUpdated in additionalInfo
    if (!platform.additionalInfo) {
      platform.additionalInfo = {};
    }
    platform.additionalInfo.lastUpdated = new Date();
    
    return this.platformsRepository.save(platform);
  }
}

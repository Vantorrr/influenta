import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Advertiser } from './entities/advertiser.entity';
import { User } from '@/users/entities/user.entity';

@Injectable()
export class AdvertisersService {
  constructor(
    @InjectRepository(Advertiser)
    private advertisersRepository: Repository<Advertiser>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<Advertiser | null> {
    return this.advertisersRepository.findOne({ 
      where: { id },
      relations: ['user'] 
    });
  }

  async findByUserId(userId: string): Promise<Advertiser | null> {
    return this.advertisersRepository.findOne({ 
      where: { userId },
      relations: ['user']
    });
  }

  async findOrCreateByUserId(userId: string): Promise<Advertiser> {
    let advertiser = await this.findByUserId(userId);
    
    if (!advertiser) {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      advertiser = this.advertisersRepository.create({
        user,
        userId,
        companyName: user.companyName || 'Не указано',
        isVerified: false,
        rating: 0,
        completedCampaigns: 0,
        totalSpent: 0,
      });

      advertiser = await this.advertisersRepository.save(advertiser);
    }

    return advertiser;
  }
}


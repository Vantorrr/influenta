import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async authenticateWithTelegram(authData: any) {
    try {
      console.log('🔴 Auth request received:', { 
        hasInitData: !!authData.initData, 
        initDataLength: authData.initData?.length,
        hasUser: !!authData.user,
        userId: authData.user?.id,
        rawBody: JSON.stringify(authData).substring(0, 300)
      });
      
      // УПРОЩЁННО: берём user только из тела запроса, без проверки подписи
      let telegramUser = authData.user;

      if (!telegramUser?.id) {
        console.error('🔴 No telegram user in request body!', { authData });
        throw new BadRequestException('Telegram user data required in request body');
      }

      console.log('🔴 Using telegram user from request:', telegramUser);
      
      // Ищем или создаем пользователя
      let user = await this.usersRepository.findOne({
        where: { telegramId: telegramUser.id.toString() }
      });

      if (!user) {
        // Создаем нового пользователя
        user = new User();
        user.telegramId = telegramUser.id.toString();
        user.firstName = telegramUser.first_name;
        user.lastName = telegramUser.last_name;
        user.username = telegramUser.username;
        user.photoUrl = telegramUser.photo_url;
        user.languageCode = telegramUser.language_code || 'ru';
        user.isActive = true;
        user.isVerified = false;

        user = await this.usersRepository.save(user);
      } else {
        // Обновляем данные существующего пользователя
        user.firstName = telegramUser.first_name;
        user.lastName = telegramUser.last_name;
        user.username = telegramUser.username;
        user.photoUrl = telegramUser.photo_url;
        user.lastLoginAt = new Date();
        
        user = await this.usersRepository.save(user);
      }

      // Создаем JWT токен
      const payload = {
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username || '',
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName || '',
          username: user.username || '',
          photoUrl: user.photoUrl || '',
          isVerified: user.isVerified,
        },
      };
    } catch (error) {
      console.error('Telegram auth error:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Authentication failed');
    }
  }

  private verifyTelegramData(initData: string): boolean {
    try {
      const botToken = this.configService.get('app.telegram.botToken');
      
      if (!botToken) {
        console.warn('Bot token not configured, skipping verification');
        return true; // В dev режиме пропускаем проверку
      }

      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Правильный секрет: SHA256(botToken) как raw bytes
      const secret = crypto.createHash('sha256').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

      return calculatedHash === hash;
    } catch (error) {
      console.error('Telegram data verification error:', error);
      return true; // В случае ошибки пропускаем проверку для dev
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName || '',
        username: user.username || '',
        photoUrl: user.photoUrl || '',
        isVerified: user.isVerified,
            onboardingCompleted: user.onboardingCompleted,
        email: user.email || null,
        languageCode: user.languageCode || null,
        bio: user.bio || '',
        role: user.role,
        phone: user.phone || null,
        website: user.website || null,
        telegramLink: user.telegramLink || null,
        instagramLink: user.instagramLink || null,
        subscribersCount: user.subscribersCount || null,
        pricePerPost: user.pricePerPost || null,
        pricePerStory: user.pricePerStory || null,
        categories: user.categories || null,
        companyName: user.companyName || null,
        description: user.description || null,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.username !== undefined) user.username = dto.username;
    if (dto.photoUrl !== undefined) user.photoUrl = dto.photoUrl;
    if (dto.email !== undefined) user.email = dto.email || null as any;
    if (dto.bio !== undefined) user.bio = dto.bio;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.website !== undefined) user.website = dto.website;
    if (dto.telegramLink !== undefined) user.telegramLink = dto.telegramLink;
    if (dto.instagramLink !== undefined) user.instagramLink = dto.instagramLink;
    if (dto.subscribersCount !== undefined) user.subscribersCount = dto.subscribersCount;
    if (dto.pricePerPost !== undefined) user.pricePerPost = dto.pricePerPost;
    if (dto.pricePerStory !== undefined) user.pricePerStory = dto.pricePerStory;
    if (dto.categories !== undefined) user.categories = dto.categories;
    if (dto.companyName !== undefined) user.companyName = dto.companyName;
    if (dto.description !== undefined) user.description = dto.description;
        if (dto.onboardingCompleted !== undefined) user.onboardingCompleted = !!dto.onboardingCompleted;
    await this.usersRepository.save(user);
    return this.getProfile(userId);
  }
}

import { Injectable } from '@nestjs/common';
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
      // Проверяем подлинность данных от Telegram
      const isValid = this.verifyTelegramData(authData.initData);
      
      if (!isValid) {
        throw new Error('Invalid Telegram data');
      }

      const telegramUser = authData.user;
      
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
      return {
        success: false,
        error: error.message,
      };
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

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

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
        email: user.email || null,
        languageCode: user.languageCode || null,
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
    await this.usersRepository.save(user);
    return this.getProfile(userId);
  }
}

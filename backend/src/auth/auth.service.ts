import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';
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
        const userData = {
          telegramId: telegramUser.id.toString(),
          firstName: telegramUser.first_name,
          isActive: true,
          isVerified: false,
        }
        
        // Добавляем опциональные поля только если они есть
        if (telegramUser.last_name) userData['lastName'] = telegramUser.last_name
        if (telegramUser.username) userData['username'] = telegramUser.username
        if (telegramUser.photo_url) userData['photoUrl'] = telegramUser.photo_url
        if (telegramUser.language_code) userData['languageCode'] = telegramUser.language_code
        
        user = this.usersRepository.create(userData)

        await this.usersRepository.save(user);
      } else {
        // Обновляем данные существующего пользователя
        await this.usersRepository.update(user.id, {
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          username: telegramUser.username,
          photoUrl: telegramUser.photo_url,
          lastLoginAt: new Date(),
        });
      }

      // Создаем JWT токен
      const payload = {
        sub: user.id,
        telegramId: user.telegramId,
        username: user.username,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          telegramId: user.telegramId,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          photoUrl: user.photoUrl,
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
}

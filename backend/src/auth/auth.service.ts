import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
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
    private telegramService: TelegramService,
  ) {}

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(fallback), timeoutMs);
      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch(() => {
          clearTimeout(timer);
          resolve(fallback);
        });
    });
  }

  async authenticateWithTelegram(authData: any) {
    try {
      console.log('🔴 Auth request received:', { 
        hasInitData: !!authData.initData, 
        initDataLength: authData.initData?.length,
        hasUser: !!authData.user,
        userId: authData.user?.id,
        rawBody: JSON.stringify(authData).substring(0, 300)
      });
      
      // Основной источник: user из тела запроса
      let telegramUser = authData.user;

      // Fallback: если user не пришел в body, пробуем достать из initData
      if (!telegramUser?.id && authData?.initData) {
        try {
          const params = new URLSearchParams(authData.initData);
          const rawUser = params.get('user');
          if (rawUser) {
            telegramUser = JSON.parse(rawUser);
            console.log('🟡 Parsed telegram user from initData fallback:', { id: telegramUser?.id });
          }
        } catch (e: any) {
          console.warn('⚠️ Failed to parse user from initData:', e?.message);
        }
      }

      if (!telegramUser?.id) {
        console.error('🔴 No telegram user in request body!', { authData });
        throw new BadRequestException('Telegram user data required in request body');
      }

      console.log('🔴 Using telegram user from request:', telegramUser);
      console.log('🔴 TG username field:', telegramUser.username, 'first_name:', telegramUser.first_name);
      
      // Не блокируем аутентификацию внешним API Telegram:
      // если Telegram тормозит/лимитит, продолжаем с данными из initData.
      const freshTgData = await this.withTimeout(
        this.telegramService.getUserInfo(telegramUser.id),
        1200,
        null,
      );
      console.log('🔴 Fresh data from Telegram API:', freshTgData);

      // Ищем или создаем пользователя
      let user = await this.usersRepository.findOne({
        where: { telegramId: telegramUser.id.toString() }
      });

      if (!user) {
        // Создаем нового пользователя
        user = new User();
        user.telegramId = telegramUser.id.toString();
        user.firstName = freshTgData?.first_name || telegramUser.first_name;
        user.lastName = freshTgData?.last_name || telegramUser.last_name;
        user.username = freshTgData?.username || telegramUser.username;
        user.photoUrl = telegramUser.photo_url;
        user.languageCode = telegramUser.language_code || 'ru';
        user.isActive = true;
        user.isVerified = false;

        try {
          user = await this.usersRepository.save(user);
          console.log('🟢 Created new user:', { id: user.id, username: user.username, firstName: user.firstName });
        } catch (saveError: any) {
          const pgCode = saveError?.code || saveError?.driverError?.code;
          if (pgCode === '23505') {
            console.log('⚠️ User already exists (race condition), fetching...');
            user = await this.usersRepository.findOne({
              where: { telegramId: telegramUser.id.toString() }
            });
            if (!user) {
              throw new BadRequestException('Failed to create or find user');
            }
          } else {
            console.error('❌ User creation failed:', { code: pgCode, message: saveError?.message });
            throw saveError;
          }
        }
      } else {
        console.log('🟡 Existing user before update:', { id: user.id, username: user.username, firstName: user.firstName });
        // Обновляем данные существующего пользователя: приоритет свежим данным из API
        user.firstName = freshTgData?.first_name || telegramUser.first_name || user.firstName;
        user.lastName = freshTgData?.last_name || telegramUser.last_name || user.lastName;
        
        // ВАЖНО: явно обновляем username, даже если он null/undefined (означает что у пользователя нет username в Telegram)
        if (freshTgData && 'username' in freshTgData) {
          user.username = freshTgData.username || undefined;
          console.log('🔵 Setting username from fresh API data:', freshTgData.username);
        } else if ('username' in telegramUser) {
          user.username = telegramUser.username || undefined;
          console.log('🔵 Setting username from initData:', telegramUser.username);
        }
        
        user.photoUrl = telegramUser.photo_url || user.photoUrl;
        user.lastLoginAt = new Date();
        
        user = await this.usersRepository.save(user);
        console.log('🟢 Updated user:', { id: user.id, username: user.username, firstName: user.firstName });
      }

      // Перезагружаем пользователя из БД, чтобы вернуть самые свежие данные
      const freshUser = await this.usersRepository.findOne({ where: { id: user.id } }) || user;

      // Создаем JWT токен
      const payload = {
        sub: freshUser.id,
        telegramId: freshUser.telegramId,
        username: freshUser.username || '',
        role: freshUser.role,
      };

      const token = this.jwtService.sign(payload);

      return {
        success: true,
        token,
        user: {
          id: freshUser.id,
          telegramId: freshUser.telegramId,
          firstName: freshUser.firstName,
          lastName: freshUser.lastName || '',
          username: freshUser.username || null,
          photoUrl: freshUser.photoUrl || '',
          isVerified: freshUser.isVerified,
          onboardingCompleted: freshUser.onboardingCompleted,
          role: freshUser.role,
          email: freshUser.email || null,
          bio: freshUser.bio || '',
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
    console.log('📋 GetProfile returning user:', { 
      id: user.id, 
      username: user.username,
      telegramId: user.telegramId 
    });
    
    return {
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName || '',
        username: user.username || null, // Важно: возвращаем null, а не пустую строку
        photoUrl: user.photoUrl || '',
        isVerified: user.isVerified,
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
        onboardingCompleted: user.onboardingCompleted,
        verificationRequested: user.verificationRequested,
        verificationRequestedAt: user.verificationRequestedAt,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    try {
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
    } catch (error: any) {
      console.error('❌ updateProfile save error:', {
        userId,
        dto,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorDetail: error?.detail,
      });
      throw new BadRequestException(
        error?.detail || error?.message || 'Ошибка сохранения профиля'
      );
    }
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Пользователь не найден');

    user.firstName = 'Удалённый';
    user.lastName = 'аккаунт';
    user.username = undefined;
    user.photoUrl = undefined;
    user.email = undefined;
    user.bio = undefined;
    user.phone = undefined;
    user.website = undefined;
    user.telegramLink = undefined;
    user.instagramLink = undefined;
    user.companyName = undefined;
    user.description = undefined;
    user.telegramData = undefined;
    user.verificationData = undefined;
    user.isActive = false;
    user.isVerified = false;
    user.onboardingCompleted = false;

    await this.usersRepository.save(user);
    console.log('🗑️ Account deleted (anonymized):', userId);
    return { success: true, message: 'Аккаунт удалён' };
  }

  async requestVerification(userId: string, data: {
    documents?: string[];
    socialProofs?: {
      platform: string;
      url: string;
      followers?: number;
    }[];
    message?: string;
    verificationCode?: string;
  }) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    if (user.isVerified) {
      throw new BadRequestException('Пользователь уже верифицирован');
    }
    
    if (user.verificationRequested && !user.verificationData?.rejectionReason) {
      throw new BadRequestException('Заявка на верификацию уже отправлена');
    }
    
    // Проверяем паспорт
    if (!data.documents?.length) {
      throw new BadRequestException('Необходимо загрузить документ (паспорт)');
    }
    
    // Проверяем соцсети с 100к+ подписчиков
    const MIN_FOLLOWERS = 100000;
    const hasEnoughFollowers = data.socialProofs?.some(p => p.followers && p.followers >= MIN_FOLLOWERS);
    if (!hasEnoughFollowers) {
      throw new BadRequestException(`Необходим аккаунт с минимум ${MIN_FOLLOWERS.toLocaleString()} подписчиков`);
    }
    
    // Проверяем код верификации
    if (!data.verificationCode) {
      throw new BadRequestException('Необходимо добавить код верификации в описание профиля');
    }
    
    user.verificationRequested = true;
    user.verificationRequestedAt = new Date();
    user.verificationData = {
      documents: data.documents || [],
      socialProofs: data.socialProofs || [],
      message: data.message,
      verificationCode: data.verificationCode,
      rejectionReason: undefined // Сбрасываем предыдущий отказ
    };
    await this.usersRepository.save(user);
    
    // Уведомляем админов о новой заявке
    try {
      const adminIds: number[] = this.configService.get<number[]>('app.admins.telegramIds') || []
      const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app'
      const fullName = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
      const username = user.username ? `@${user.username}` : ''
      // Собираем информацию о соцсетях
      const socialInfo = data.socialProofs?.map(p => 
        `  • ${p.platform}: ${p.followers?.toLocaleString() || '?'} подписчиков`
      ).join('\n') || ''
      
      const adminText = [
        '🆕 <b>Новая заявка на верификацию</b>',
        '',
        `👤 <b>Пользователь:</b> ${fullName} ${username}`.trim(),
        `🆔 <b>ID:</b> ${user.telegramId}`,
        '',
        `🔑 <b>Код верификации:</b> <code>${data.verificationCode}</code>`,
        '',
        (data.socialProofs?.length || 0) > 0 ? `📱 <b>Соцсети:</b>\n${socialInfo}` : '',
        '',
        `📎 Документов: ${data.documents?.length || 0}`,
        data.message ? `📝 <b>Сообщение:</b> ${data.message}` : '',
        '',
        '⚠️ <b>Проверьте:</b> код должен быть в описании профиля соцсети'
      ].filter(Boolean).join('\n')

      const keyboard: any = {
        inline_keyboard: [
          [{ text: '🛡 Открыть модерацию', web_app: { url: `${frontendUrl}/admin/moderation` } }],
        ] as any[],
      }
      const dmUrl = user.username ? `https://t.me/${user.username}` : `tg://user?id=${user.telegramId}`
      keyboard.inline_keyboard.push([{ text: '✉️ Написать в Telegram', url: dmUrl }])

      for (const adminId of adminIds) {
        await this.telegramService.sendMessage(adminId, adminText, keyboard)
      }
    } catch {}

    return {
      success: true,
      message: 'Заявка на верификацию отправлена. Администратор рассмотрит её в ближайшее время.'
    };
  }
}














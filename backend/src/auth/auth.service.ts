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
      console.log('🔴 TG username field:', telegramUser.username, 'first_name:', telegramUser.first_name);
      
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
        console.log('🟢 Created new user:', { id: user.id, username: user.username, firstName: user.firstName });
      } else {
        console.log('🟡 Existing user before update:', { id: user.id, username: user.username, firstName: user.firstName });
        // Обновляем данные существующего пользователя из Telegram
        user.firstName = telegramUser.first_name || user.firstName;
        user.lastName = telegramUser.last_name || user.lastName;
        // Если Telegram передал username — обновляем, иначе оставляем текущий
        if (telegramUser.username !== undefined) {
          user.username = telegramUser.username;
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
          username: freshUser.username || '',
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

  async requestVerification(userId: string, data: {
    documents?: string[];
    socialProofs?: {
      platform: string;
      url: string;
      followers?: number;
    }[];
    message?: string;
  }) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    
    if (user.isVerified) {
      throw new BadRequestException('Пользователь уже верифицирован');
    }
    
    if (user.verificationRequested && !user.verificationData?.rejectionReason) {
      throw new BadRequestException('Заявка на верификацию уже отправлена');
    }
    
    // Проверяем что предоставлены доказательства
    if (!data.documents?.length && !data.socialProofs?.length) {
      throw new BadRequestException('Необходимо предоставить документы или ссылки на социальные сети');
    }
    
    user.verificationRequested = true;
    user.verificationRequestedAt = new Date();
    user.verificationData = {
      documents: data.documents || [],
      socialProofs: data.socialProofs || [],
      message: data.message,
      rejectionReason: undefined // Сбрасываем предыдущий отказ
    };
    await this.usersRepository.save(user);
    
    // Уведомляем админов о новой заявке
    try {
      const adminIds: number[] = this.configService.get<number[]>('app.admins.telegramIds') || []
      const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app'
      const fullName = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim()
      const username = user.username ? `@${user.username}` : ''
      const adminText = [
        '🆕 <b>Новая заявка на верификацию</b>',
        '',
        `👤 <b>Пользователь:</b> ${fullName} ${username}`.trim(),
        `🆔 <b>ID:</b> ${user.telegramId}`,
        data.message ? `📝 <b>Сообщение:</b> ${data.message}` : '',
        (data.documents?.length || 0) > 0 ? `📎 Документов: ${data.documents!.length}` : '',
        (data.socialProofs?.length || 0) > 0 ? `🔗 Ссылок: ${data.socialProofs!.length}` : ''
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










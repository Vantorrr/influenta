import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { TelegramService } from '../telegram/telegram.service';
import { User } from '../users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TelegramAuthDto, TelegramUserPayload } from './dto/telegram-auth.dto';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  // -----------------------------------------------------------------------
  // Утилиты
  // -----------------------------------------------------------------------

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

  /** Возвращает строку, обрезанную до length, или undefined если пусто. */
  private safeString(value: unknown, maxLength = 255): string | undefined {
    if (value === null || value === undefined) return undefined;
    const str = String(value).trim();
    if (!str) return undefined;
    return str.length > maxLength ? str.slice(0, maxLength) : str;
  }

  private sanitizeUsername(value: unknown): string | undefined {
    const str = this.safeString(value, 64);
    if (!str) return undefined;
    // Telegram username не содержит '@', но на всякий случай чистим
    return str.replace(/^@+/, '').trim() || undefined;
  }

  /**
   * Извлекает Telegram user из тела запроса или из подписанного initData.
   * initData предпочтительнее, поскольку его подписывает Telegram (проверяемая аутентификация).
   */
  private extractTelegramUser(payload: TelegramAuthDto): TelegramUserPayload | null {
    let user: TelegramUserPayload | null = null;

    if (payload.initData) {
      try {
        const params = new URLSearchParams(payload.initData);
        const rawUser = params.get('user');
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed && (parsed.id !== undefined && parsed.id !== null)) {
            user = parsed as TelegramUserPayload;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Failed to parse user from initData: ${err?.message}`);
      }
    }

    // Тело запроса используем как фолбэк, если в initData нет user (старые клиенты)
    if (!user && payload.user && payload.user.id !== undefined && payload.user.id !== null) {
      user = payload.user;
    }

    return user;
  }

  /**
   * Проверяет подлинность initData по правилам Telegram WebApp.
   * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
   */
  private verifyTelegramInitData(initData: string | undefined, botToken: string): boolean {
    if (!initData) return false;
    try {
      const params = new URLSearchParams(initData);
      const hash = params.get('hash');
      if (!hash) return false;
      params.delete('hash');

      const dataCheckString = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
      const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

      return crypto.timingSafeEqual(Buffer.from(calculatedHash, 'hex'), Buffer.from(hash, 'hex'));
    } catch (err: any) {
      this.logger.warn(`verifyTelegramInitData error: ${err?.message}`);
      return false;
    }
  }

  // -----------------------------------------------------------------------
  // Авторизация / регистрация
  // -----------------------------------------------------------------------

  async authenticateWithTelegram(authData: TelegramAuthDto) {
    const telegramUser = this.extractTelegramUser(authData);

    if (!telegramUser || telegramUser.id === undefined || telegramUser.id === null) {
      this.logger.warn('Auth attempt without telegram user payload');
      throw new BadRequestException(
        'Не удалось получить данные Telegram. Откройте мини-приложение через кнопку в боте.',
      );
    }

    const telegramId = String(telegramUser.id).trim();
    if (!telegramId || !/^\d+$/.test(telegramId)) {
      this.logger.warn(`Invalid telegramId received: ${telegramId}`);
      throw new BadRequestException('Некорректный идентификатор Telegram.');
    }

    // Опциональная проверка подписи initData. Включается переменной окружения
    // AUTH_VERIFY_INIT_DATA=true. Включать рекомендуется в проде.
    const shouldVerify =
      (this.configService.get<string>('AUTH_VERIFY_INIT_DATA') || process.env.AUTH_VERIFY_INIT_DATA) === 'true';
    if (shouldVerify) {
      const botToken =
        this.configService.get<string>('app.telegram.botToken') || process.env.TELEGRAM_BOT_TOKEN || '';
      if (botToken && !this.verifyTelegramInitData(authData.initData, botToken)) {
        this.logger.warn(`Invalid initData signature for telegramId=${telegramId}`);
        throw new UnauthorizedException('Подпись Telegram WebApp не прошла проверку.');
      }
    }

    // Опциональное обогащение свежими данными из Telegram API.
    const shouldEnrichFromTelegram =
      (this.configService.get<string>('AUTH_TELEGRAM_ENRICH') || process.env.AUTH_TELEGRAM_ENRICH) === 'true';
    const freshTgData = shouldEnrichFromTelegram
      ? await this.withTimeout(this.telegramService.getUserInfo(Number(telegramId)), 1200, null)
      : null;

    // Основные поля с дефолтами, чтобы NOT NULL колонки не падали
    const firstName =
      this.safeString(freshTgData?.first_name) ||
      this.safeString(telegramUser.first_name) ||
      'Пользователь';
    const lastName = this.safeString(freshTgData?.last_name) || this.safeString(telegramUser.last_name);
    const username = this.sanitizeUsername(freshTgData?.username ?? telegramUser.username);
    const photoUrl = this.safeString((telegramUser as any).photo_url, 1024);
    const languageCode = this.safeString(telegramUser.language_code, 16) || 'ru';

    // Ищем существующего пользователя
    let user = await this.usersRepository.findOne({ where: { telegramId } });

    try {
      if (!user) {
        user = this.usersRepository.create({
          telegramId,
          firstName,
          lastName,
          username,
          photoUrl,
          languageCode,
          isActive: true,
          isVerified: false,
          lastLoginAt: new Date(),
        });
        try {
          user = await this.usersRepository.save(user);
          this.logger.log(`✅ Created new user: id=${user.id} telegramId=${telegramId} username=${username || '-'}`);
        } catch (saveError: any) {
          const pgCode = saveError?.code || saveError?.driverError?.code;
          if (pgCode === PG_UNIQUE_VIOLATION) {
            // Гонка: другой запрос уже создал этого пользователя — забираем существующую запись
            this.logger.warn(`User race condition for telegramId=${telegramId}, fetching existing`);
            user = await this.usersRepository.findOne({ where: { telegramId } });
            if (!user) {
              throw new InternalServerErrorException('Не удалось создать пользователя. Попробуйте ещё раз.');
            }
          } else {
            this.logger.error(
              `User creation failed for telegramId=${telegramId}: ${saveError?.message}`,
              saveError?.stack,
            );
            throw new InternalServerErrorException(
              'Ошибка сохранения профиля. Попробуйте перезапустить приложение.',
            );
          }
        }
      } else {
        // Аккуратно обновляем поля у существующего пользователя
        user.firstName = firstName;
        if (lastName !== undefined) user.lastName = lastName;
        if (username !== undefined) user.username = username;
        // Если username стал пустым (пользователь убрал его в Telegram) — обнуляем
        if (freshTgData && 'username' in freshTgData && !freshTgData.username) {
          user.username = undefined;
        }
        if (photoUrl) user.photoUrl = photoUrl;
        if (languageCode) user.languageCode = languageCode;
        user.lastLoginAt = new Date();
        // Реактивируем аккаунт, если ранее был помечен как удалённый/неактивный
        if (user.isActive === false) {
          user.isActive = true;
        }

        try {
          user = await this.usersRepository.save(user);
        } catch (updateError: any) {
          // Update — некритично. Если падает (например, длинное поле), просто логируем.
          this.logger.warn(
            `User update failed for telegramId=${telegramId}: ${updateError?.message}. Continuing with stale record.`,
          );
        }
      }
    } catch (e) {
      if (e instanceof BadRequestException || e instanceof UnauthorizedException || e instanceof InternalServerErrorException) {
        throw e;
      }
      this.logger.error(`Unexpected auth error: ${(e as any)?.message}`, (e as any)?.stack);
      throw new InternalServerErrorException('Ошибка авторизации. Попробуйте ещё раз.');
    }

    const freshUser = (await this.usersRepository.findOne({ where: { id: user.id } })) || user;

    const payload = {
      sub: freshUser.id,
      telegramId: freshUser.telegramId,
      username: freshUser.username || '',
      role: freshUser.role,
    };

    let token: string;
    try {
      token = this.jwtService.sign(payload);
    } catch (e: any) {
      this.logger.error(`JWT sign failed: ${e?.message}`, e?.stack);
      throw new InternalServerErrorException('Не удалось выдать токен. Попробуйте ещё раз.');
    }

    return {
      success: true,
      token,
      user: this.serializeUser(freshUser),
    };
  }

  private serializeUser(user: User) {
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName || '',
      username: user.username || null,
      photoUrl: user.photoUrl || '',
      isVerified: user.isVerified,
      onboardingCompleted: user.onboardingCompleted,
      role: user.role,
      email: user.email || null,
      bio: user.bio || '',
      phone: user.phone || null,
      website: user.website || null,
      telegramLink: user.telegramLink || null,
      instagramLink: user.instagramLink || null,
      subscribersCount: user.subscribersCount ?? null,
      pricePerPost: user.pricePerPost ?? null,
      pricePerStory: user.pricePerStory ?? null,
      categories: user.categories || null,
      companyName: user.companyName || null,
      description: user.description || null,
      languageCode: user.languageCode || null,
      verificationRequested: user.verificationRequested,
      verificationRequestedAt: user.verificationRequestedAt,
    };
  }

  // -----------------------------------------------------------------------
  // Профиль
  // -----------------------------------------------------------------------

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return { success: true, user: this.serializeUser(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Применяем только определённые поля. Strict undefined check, чтобы '0' и '' сохранялись корректно.
    if (dto.firstName !== undefined) user.firstName = this.safeString(dto.firstName) || user.firstName;
    if (dto.lastName !== undefined) user.lastName = this.safeString(dto.lastName);
    if (dto.username !== undefined) user.username = this.sanitizeUsername(dto.username);
    if (dto.photoUrl !== undefined) user.photoUrl = this.safeString(dto.photoUrl, 1024);
    if (dto.email !== undefined) user.email = this.safeString(dto.email, 255);
    if (dto.bio !== undefined) user.bio = this.safeString(dto.bio, 2000);
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.phone !== undefined) user.phone = this.safeString(dto.phone, 32);
    if (dto.website !== undefined) user.website = this.safeString(dto.website, 512);
    if (dto.telegramLink !== undefined) user.telegramLink = this.safeString(dto.telegramLink, 512);
    if (dto.instagramLink !== undefined) user.instagramLink = this.safeString(dto.instagramLink, 512);
    if (dto.subscribersCount !== undefined) user.subscribersCount = this.normalizeBigInt(dto.subscribersCount);
    if (dto.pricePerPost !== undefined) user.pricePerPost = this.normalizeBigInt(dto.pricePerPost);
    if (dto.pricePerStory !== undefined) user.pricePerStory = this.normalizeBigInt(dto.pricePerStory);
    if (dto.categories !== undefined) user.categories = this.safeString(dto.categories, 512);
    if (dto.companyName !== undefined) user.companyName = this.safeString(dto.companyName, 255);
    if (dto.description !== undefined) user.description = this.safeString(dto.description, 2000);
    if (dto.onboardingCompleted !== undefined) user.onboardingCompleted = !!dto.onboardingCompleted;

    try {
      await this.usersRepository.save(user);
    } catch (error: any) {
      this.logger.error(
        `updateProfile save error for user ${userId}: ${error?.message} (code=${error?.code})`,
        error?.stack,
      );
      const pgCode = error?.code || error?.driverError?.code;
      if (pgCode === PG_UNIQUE_VIOLATION) {
        throw new BadRequestException('Этот email уже используется другим аккаунтом.');
      }
      throw new BadRequestException(
        error?.message?.startsWith('value too long')
          ? 'Слишком длинное значение в одном из полей. Сократите текст.'
          : 'Не удалось сохранить профиль. Попробуйте ещё раз.',
      );
    }

    return this.getProfile(userId);
  }

  /** Нормализует значение в безопасное число для bigint колонок. */
  private normalizeBigInt(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(num)) return null;
    if (num < 0) return 0;
    // PostgreSQL bigint max — но реалистичный потолок для подписчиков/цен
    const MAX = 9_999_999_999_999;
    return Math.min(Math.floor(num), MAX);
  }

  async deleteAccount(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

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
    this.logger.log(`🗑️ Account anonymized: ${userId}`);
    return { success: true, message: 'Аккаунт удалён' };
  }

  async requestVerification(
    userId: string,
    data: {
      documents?: string[];
      socialProofs?: { platform: string; url: string; followers?: number }[];
      message?: string;
      verificationCode?: string;
    },
  ) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (user.isVerified) {
      throw new BadRequestException('Пользователь уже верифицирован');
    }

    if (user.verificationRequested && !user.verificationData?.rejectionReason) {
      throw new BadRequestException('Заявка на верификацию уже отправлена');
    }

    if (!data.documents?.length) {
      throw new BadRequestException('Необходимо загрузить документ (паспорт)');
    }

    const MIN_FOLLOWERS = 100000;
    const hasEnoughFollowers = data.socialProofs?.some((p) => p.followers && p.followers >= MIN_FOLLOWERS);
    if (!hasEnoughFollowers) {
      throw new BadRequestException(
        `Необходим аккаунт с минимум ${MIN_FOLLOWERS.toLocaleString()} подписчиков`,
      );
    }

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
      rejectionReason: undefined,
    };
    await this.usersRepository.save(user);

    // Уведомляем админов о новой заявке (любые ошибки в Telegram API не должны ломать ответ пользователю)
    try {
      const adminIds: number[] = this.configService.get<number[]>('app.admins.telegramIds') || [];
      const frontendUrl = this.configService.get('app.frontendUrl') || 'https://influentaa.vercel.app';
      const fullName = `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`.trim();
      const username = user.username ? `@${user.username}` : '';
      const socialInfo =
        data.socialProofs
          ?.map((p) => `  • ${p.platform}: ${p.followers?.toLocaleString() || '?'} подписчиков`)
          .join('\n') || '';

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
        '⚠️ <b>Проверьте:</b> код должен быть в описании профиля соцсети',
      ]
        .filter(Boolean)
        .join('\n');

      const keyboard: any = {
        inline_keyboard: [
          [{ text: '🛡 Открыть модерацию', web_app: { url: `${frontendUrl}/admin/moderation` } }],
        ] as any[],
      };
      const dmUrl = user.username
        ? `https://t.me/${user.username}`
        : `tg://user?id=${user.telegramId}`;
      keyboard.inline_keyboard.push([{ text: '✉️ Написать в Telegram', url: dmUrl }]);

      for (const adminId of adminIds) {
        await this.telegramService.sendMessage(adminId, adminText, keyboard);
      }
    } catch (notifyError: any) {
      this.logger.warn(`Failed to notify admins about verification request: ${notifyError?.message}`);
    }

    return {
      success: true,
      message: 'Заявка на верификацию отправлена. Администратор рассмотрит её в ближайшее время.',
    };
  }
}

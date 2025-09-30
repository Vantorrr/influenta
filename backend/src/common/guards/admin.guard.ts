import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    // Получаем список админских Telegram ID из конфига
    const adminTelegramIds = this.configService.get<number[]>('app.admins.telegramIds') ?? [];
    const adminEmails = this.configService.get<string[]>('app.admins.emails') ?? [];

    // Проверяем является ли пользователь админом
    const isAdminByTelegramId = user.telegramId && adminTelegramIds.includes(parseInt(String(user.telegramId)));
    const isAdminByEmail = !!user.email && adminEmails.includes(user.email);
    const isAdminByRole = user.role === 'admin';

    if (!isAdminByTelegramId && !isAdminByEmail && !isAdminByRole) {
      throw new ForbiddenException('Access denied. Admin rights required.');
    }

    return true;
  }
}






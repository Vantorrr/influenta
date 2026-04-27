import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO для авторизации через Telegram WebApp.
 * Поле `user` помечено @IsObject(), чтобы оно прошло whitelist валидатора
 * с включёнными опциями `whitelist: true` и `forbidNonWhitelisted: true`.
 */
export class TelegramAuthDto {
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  initData?: string;

  @IsOptional()
  @IsObject()
  user?: TelegramUserPayload;
}

export interface TelegramUserPayload {
  id: number | string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
  [key: string]: any;
}

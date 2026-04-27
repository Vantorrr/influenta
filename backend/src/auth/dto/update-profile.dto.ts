import { IsOptional, IsString, IsEnum, IsNumber, IsBoolean, MaxLength, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Преобразует входящее значение в число.
 * Принимает: number | numeric string | строку с разделителями ('.', ',', пробелы).
 * Возвращает undefined для null/empty/невалидных значений, чтобы поле игнорировалось.
 */
const toOptionalNumber = ({ value }: { value: unknown }): number | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  if (!cleaned) return undefined;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : undefined;
};

const toOptionalBool = ({ value }: { value: unknown }): boolean | undefined => {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase().trim();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return undefined;
};

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  photoUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Недопустимая роль. Допустимо: blogger | advertiser.',
  })
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  telegramLink?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  instagramLink?: string;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({}, { message: 'subscribersCount должно быть числом.' })
  @Min(0, { message: 'subscribersCount не может быть отрицательным.' })
  subscribersCount?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({}, { message: 'pricePerPost должно быть числом.' })
  @Min(0)
  pricePerPost?: number;

  @IsOptional()
  @Transform(toOptionalNumber)
  @IsNumber({}, { message: 'pricePerStory должно быть числом.' })
  @Min(0)
  pricePerStory?: number;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  categories?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Transform(toOptionalBool)
  @IsBoolean()
  onboardingCompleted?: boolean;
}

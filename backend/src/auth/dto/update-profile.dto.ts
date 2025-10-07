import { IsOptional, IsString, IsUrl, IsEmail, IsEnum } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  telegramLink?: string;

  @IsOptional()
  @IsString()
  instagramLink?: string;

  // Поля для блогеров
  @IsOptional()
  subscribersCount?: number;

  @IsOptional()
  pricePerPost?: number;

  @IsOptional()
  pricePerStory?: number;

  @IsOptional()
  @IsString()
  categories?: string;

  // Поля для рекламодателей
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  onboardingCompleted?: boolean;
}











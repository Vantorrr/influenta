import { IsEnum, IsString, IsNumber, IsOptional, IsBoolean, IsUrl, IsArray, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformType } from '../entities/social-platform.entity';

export class CreateSocialPlatformDto {
  @IsEnum(PlatformType)
  platform: PlatformType;

  @IsString()
  username: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  subscribersCount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-1, { message: 'Цена должна быть >= 0 или -1 для договорной' })
  pricePerPost?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-1, { message: 'Цена должна быть >= 0 или -1 для договорной' })
  pricePerStory?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-1, { message: 'Цена должна быть >= 0 или -1 для договорной' })
  pricePerReel?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-1, { message: 'Цена должна быть >= 0 или -1 для договорной' })
  pricePerStream?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  statisticsScreenshots?: string[];

  @IsOptional()
  @IsObject()
  additionalInfo?: {
    views30days?: number;
    uniqueViewers30days?: number;
    averageViews?: number;
    engagementRate?: number;
    audienceAge?: string;
    audienceGender?: string;
    audienceLocation?: string;
    contentLanguage?: string;
    verificationStatus?: string;
  };

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}





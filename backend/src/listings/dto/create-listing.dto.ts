import { IsString, IsNumber, IsArray, IsEnum, IsOptional, IsDateString, IsObject, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { BloggerCategory, PostFormat } from '@/types';

export class CreateListingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsEnum(BloggerCategory, { each: true })
  targetCategories: BloggerCategory[];

  @IsNumber()
  @Min(0)
  budget: number;

  @IsEnum(PostFormat)
  @Transform(({ value }) => (value === 'reels' || value === 'reel' ? 'live' : value))
  format: PostFormat;

  @IsObject()
  @IsOptional()
  requirements?: {
    // кастомная проверка будет в сервисе
    minSubscribers?: number;
    maxSubscribers?: number;
    minEngagementRate?: number;
    minRating?: number;
    verifiedOnly?: boolean;
    categories?: BloggerCategory[];
  };

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

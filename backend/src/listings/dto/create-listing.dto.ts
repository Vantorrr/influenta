import { IsString, IsNumber, IsArray, IsEnum, IsOptional, IsDateString, IsObject, Min, Max } from 'class-validator';
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
  @Min(-1) // -1 = "Договорная"
  @Max(99999999) // верхний предел для бюджета
  budget: number;

  @IsEnum(PostFormat)
  @Transform(({ value }) => (value === 'reels' || value === 'reel' ? 'live' : value))
  format: PostFormat;

  @IsObject()
  @IsOptional()
  requirements?: {
    minSubscribers?: number;
    verifiedOnly?: boolean;
    categories?: BloggerCategory[];
  };

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
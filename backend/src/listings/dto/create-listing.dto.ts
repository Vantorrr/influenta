import { IsString, IsNumber, IsArray, IsEnum, IsOptional, IsDateString, IsObject, Min } from 'class-validator';
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
  format: PostFormat;

  @IsObject()
  @IsOptional()
  requirements?: {
    minSubscribers?: number;
    minEngagementRate?: number;
    minRating?: number;
    verifiedOnly?: boolean;
    categories?: BloggerCategory[];
  };

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

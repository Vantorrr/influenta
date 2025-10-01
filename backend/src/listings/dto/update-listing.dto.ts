import { IsOptional, IsString, IsNumber, IsEnum, IsArray, IsObject } from 'class-validator';
import { PostFormat, ListingStatus, BloggerCategory } from '@/types';

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(BloggerCategory, { each: true })
  targetCategories?: BloggerCategory[];

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsEnum(PostFormat)
  format?: PostFormat;

  @IsOptional()
  @IsObject()
  requirements?: {
    minSubscribers?: number;
    minEngagementRate?: number;
    minRating?: number;
    verifiedOnly?: boolean;
  };

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}


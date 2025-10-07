import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BloggerCategory } from '@/types';

export class BloggerSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(BloggerCategory, { each: true })
  categories?: BloggerCategory[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  verifiedOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minSubscribers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSubscribers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}





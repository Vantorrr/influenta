import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BloggerCategory } from '@/types';

// Объединенный DTO для query: включает фильтры и пагинацию
export class BloggerSearchQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean)
    return []
  })
  @IsArray()
  categories?: (BloggerCategory | string)[];

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  verifiedOnly?: boolean;

  // Дополнительные фильтры
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minSubscribers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxSubscribers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAverageViews?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAverageViews?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 500;
}










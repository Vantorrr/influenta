import { IsOptional, IsString, IsBoolean, IsArray, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { BloggerCategory } from '@/types';

// Объединенный DTO для query: включает фильтры и пагинацию
export class BloggerSearchQueryDto {
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
  maxPrice?: number; // pricePerPost верхняя граница

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}










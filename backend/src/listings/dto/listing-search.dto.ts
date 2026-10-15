import { IsOptional, IsString, IsEnum, IsInt, Min, IsArray, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ListingStatus } from '@/types';

export class ListingSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBudget?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxBudget?: number;

  @IsOptional()
  @IsString()
  format?: string;

  /** Фильтр по тематикам объявления (humor, beauty, …) */
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
  })
  @IsArray()
  categories?: string[];

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  useSafeDeal?: boolean;
}








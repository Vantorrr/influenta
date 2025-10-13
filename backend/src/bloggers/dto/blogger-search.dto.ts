import { IsOptional, IsString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
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
}









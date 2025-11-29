import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { BloggerCategory } from '../../bloggers/entities/blogger.entity';

export class UpdateBloggerAdminDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsNumber()
  pricePerPost?: number;

  @IsOptional()
  @IsNumber()
  pricePerStory?: number;

  @IsOptional()
  @IsArray()
  categories?: BloggerCategory[];

  @IsOptional()
  @IsString()
  adminNotes?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}


import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ListingStatus } from '@/types';

export class ListingSearchDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}





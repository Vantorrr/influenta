import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeliverDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

export class DisputeDealDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reason?: string;
}

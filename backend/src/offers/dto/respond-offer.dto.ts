import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class RespondOfferDto {
  @IsBoolean()
  accept: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}










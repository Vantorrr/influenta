import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, MinLength, Min } from 'class-validator';
import { PostFormat } from '@/types';

export class CreateOfferDto {
  @IsString()
  bloggerId: string;

  @IsString()
  @MinLength(10, { message: 'Сообщение должно содержать минимум 10 символов' })
  message: string;

  @IsNumber()
  @Min(100, { message: 'Минимальный бюджет 100₽' })
  proposedBudget: number;

  @IsOptional()
  @IsString()
  projectTitle?: string;

  @IsOptional()
  @IsString()
  projectDescription?: string;

  @IsOptional()
  @IsEnum(PostFormat)
  format?: PostFormat;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}




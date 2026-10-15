import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/** Тело запроса на инициализацию оплаты безопасной сделки */
export class CreatePaymentDto {
  @IsOptional()
  @IsIn(['card', 'crypto'])
  paymentMethod?: 'card' | 'crypto';

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cryptoWalletId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  cryptoAmount?: string;
}

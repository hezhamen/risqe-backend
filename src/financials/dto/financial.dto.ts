import { IsString, IsNumber, IsNotEmpty, Min, IsEnum } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @IsString()
  @IsNotEmpty()
  paymentDetails: string;
}

export class ProcessTransactionDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['COMPLETED', 'FAILED'])
  status: string;

  @IsString()
  externalTransactionId?: string;

  @IsString()
  failureReason?: string;
}

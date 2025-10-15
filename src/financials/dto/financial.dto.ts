import { IsString, IsNumber, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWithdrawalRequestDto {
  @ApiProperty({ example: 25 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'BANK_TRANSFER' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({ example: '{"iban":"DE89 3704 0044 0532 0130 00"}' })
  @IsString()
  @IsNotEmpty()
  paymentDetails: string;
}

export class ProcessTransactionDto {
  @ApiProperty({ example: 'd3e1b9e9-4d9c-4cf1-8a0e-0f0b7c6a2f77' })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ enum: ['COMPLETED', 'FAILED'], example: 'COMPLETED' })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['COMPLETED', 'FAILED'])
  status: string;

  @ApiPropertyOptional({ example: 'ext_173213234' })
  @IsString()
  externalTransactionId?: string;

  @ApiPropertyOptional({ example: 'Insufficient funds' })
  @IsString()
  failureReason?: string;
}

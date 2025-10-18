import { IsString, IsNumber, IsNotEmpty, Min, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWithdrawalRequestDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 25.00,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Payment method for withdrawal',
    example: 'BANK_TRANSFER',
    enum: ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY']
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiProperty({
    description: 'Payment details (JSON string with method-specific information)',
    example: '{"iban": "DE89 3704 0044 0532 0130 00", "accountName": "John Doe"}'
  })
  @IsString()
  @IsNotEmpty()
  paymentDetails: string;
}

export class ProcessTransactionDto {
  @ApiProperty({
    description: 'Transaction ID to process',
    example: 'uuid-string'
  })
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({
    description: 'Transaction status',
    example: 'COMPLETED',
    enum: ['COMPLETED', 'FAILED']
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(['COMPLETED', 'FAILED'])
  status: string;

  @ApiProperty({
    description: 'External transaction ID (optional)',
    example: 'ext_txn_123456',
    required: false
  })
  @IsString()
  externalTransactionId?: string;

  @ApiProperty({
    description: 'Failure reason (required if status is FAILED)',
    example: 'Insufficient funds',
    required: false
  })
  @IsString()
  failureReason?: string;
}

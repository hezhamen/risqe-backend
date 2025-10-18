import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    description: 'Phone number in international format',
    example: '+9647721270202',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Phone number in international format',
    example: '+9647721270202',
    pattern: '^\\+[1-9]\\d{1,14}$'
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'OTP verification code',
    example: '123456',
    minLength: 4,
    maxLength: 8
  })
  @IsString()
  @Length(4, 8)
  code: string;
}



import {
  IsPhoneNumber,
  IsString,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User phone number in international format',
    example: '+9647721270202',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'User first name',
    example: 'Ahmed',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Hassan',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'User password (minimum 6 characters)',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

export class LoginDto {
  @ApiProperty({
    description: 'User phone number in international format',
    example: '+9647721270202',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

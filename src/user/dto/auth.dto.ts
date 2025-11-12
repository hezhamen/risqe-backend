import {
  IsPhoneNumber,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsEmail,
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

export class InitiateRegisterDto {
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

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'User phone number in international format',
    example: '+9647721270202',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'User first name',
    example: 'Ahmed',
    minLength: 1,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  firstName?: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Hassan',
    minLength: 1,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  lastName?: string;

  @ApiProperty({
    description: 'URL to user profile photo',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password for verification',
    example: 'oldpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'newpassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;
}

export class RequestPhoneChangeDto {
  @ApiProperty({
    description: 'New phone number in international format',
    example: '+9647721270203',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  newPhoneNumber: string;
}

export class VerifyPhoneChangeDto {
  @ApiProperty({
    description: 'New phone number in international format',
    example: '+9647721270203',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsPhoneNumber()
  @IsNotEmpty()
  newPhoneNumber: string;

  @ApiProperty({
    description: 'OTP verification code',
    example: '123456',
    minLength: 4,
    maxLength: 8,
  })
  @IsString()
  @MinLength(4)
  @IsNotEmpty()
  code: string;
}

export class UploadCollateralDto {
  @ApiProperty({
    description: 'Type of collateral document',
    enum: ['house', 'car'],
    example: 'house',
  })
  @IsEnum(['house', 'car'])
  @IsNotEmpty()
  documentType: 'house' | 'car';
}

export class CheckUserByEmailDto {
  @ApiProperty({
    description: 'Email address to check',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

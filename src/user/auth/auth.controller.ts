import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  ValidationPipe,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  InitiateRegisterDto,
  ForgotPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  RequestPhoneChangeDto,
  VerifyPhoneChangeDto,
  UploadCollateralDto,
  CheckUserByEmailDto,
} from '../dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './get-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Create a new user account with phone number, first name, last name, and password',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register/initiate')
  @ApiOperation({
    summary: 'Initiate user registration with OTP',
    description:
      'Create an unverified user account and send OTP for phone verification',
  })
  @ApiBody({ type: InitiateRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration initiated successfully, OTP sent',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        phoneNumber: { type: 'string', example: '+9647721270202' },
        provider: {
          type: 'string',
          enum: ['namabar', 'dev'],
          example: 'namabar',
        },
        verificationId: { type: 'string', example: '68f389fe7c3e004536e0efb0' },
        devCode: {
          type: 'string',
          example: '123456',
          description: 'Only returned in development mode',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists with verified phone' })
  async initiateRegistration(@Body(ValidationPipe) initiateRegisterDto: InitiateRegisterDto) {
    return this.authService.initiateRegistration(initiateRegisterDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticate user with phone number and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the authenticated user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'ce17af98-8628-44f4-aac6-dc42113d5ce1' },
        phoneNumber: { type: 'string', example: '+9647721270202' },
        firstName: { type: 'string', example: 'Test' },
        lastName: { type: 'string', example: 'User' },
        email: { type: 'string', example: 'test@example.com', nullable: true },
        photoUrl: { type: 'string', example: 'https://example.com/photo.jpg', nullable: true },
        internalBalance: { type: 'number', example: 0.0 },
        pointsBalance: { type: 'number', example: 0 },
        creditScore: { type: 'number', example: 500 },
        isPhoneVerified: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.phoneNumber);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description:
      'Request password reset for a user account. Sends OTP to the user phone number for password reset verification.',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset OTP sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password reset OTP sent to your phone' },
        provider: { type: 'string', enum: ['namabar', 'dev'], example: 'namabar' },
        verificationId: { type: 'string', example: '68f389fe7c3e004536e0efb0' },
        devCode: {
          type: 'string',
          example: '123456',
          description: 'Only returned in development mode',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async forgotPassword(@Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user profile',
    description: "Update authenticated user's profile information (first name, last name, photo URL)",
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'ce17af98-8628-44f4-aac6-dc42113d5ce1' },
        phoneNumber: { type: 'string', example: '+9647721270202' },
        firstName: { type: 'string', example: 'Ahmed' },
        lastName: { type: 'string', example: 'Hassan' },
        email: { type: 'string', example: 'test@example.com', nullable: true },
        photoUrl: { type: 'string', example: 'https://example.com/photo.jpg', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing token' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async updateProfile(
    @GetUser() user: any,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
    description: "Change user's password. Requires current password for verification.",
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Password changed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed or current password incorrect',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @GetUser() user: any,
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('phone/change/request')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Request OTP for phone number change',
    description: 'Request OTP to change user phone number. Sends OTP to the new phone number for verification.',
  })
  @ApiBody({ type: RequestPhoneChangeDto })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully to new phone number',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'OTP sent to new phone number' },
        provider: { type: 'string', enum: ['namabar', 'dev'], example: 'namabar' },
        verificationId: { type: 'string', example: '68f389fe7c3e004536e0efb0' },
        devCode: {
          type: 'string',
          example: '123456',
          description: 'Only returned in development mode',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid phone number format or phone already in use',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async requestPhoneChangeOtp(
    @GetUser() user: any,
    @Body(ValidationPipe) requestPhoneChangeDto: RequestPhoneChangeDto,
  ) {
    return this.authService.requestPhoneChangeOtp(user.id, requestPhoneChangeDto);
  }

  @Post('phone/change/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify OTP and change phone number',
    description: 'Verify OTP and update user phone number to the new phone number.',
  })
  @ApiBody({ type: VerifyPhoneChangeDto })
  @ApiResponse({
    status: 200,
    description: 'Phone number updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Phone number updated successfully' },
        phoneNumber: { type: 'string', example: '+9647721270203' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyPhoneChangeOtp(
    @GetUser() user: any,
    @Body(ValidationPipe) verifyPhoneChangeDto: VerifyPhoneChangeDto,
  ) {
    return this.authService.verifyPhoneChange(user.id, verifyPhoneChangeDto);
  }

  @Post('collateral/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('document'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload collateral document',
    description:
      'Upload a collateral document (house or car) for credit score verification. Accepts multipart/form-data with document file.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        documentType: {
          type: 'string',
          enum: ['house', 'car'],
          example: 'house',
        },
        document: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['documentType', 'document'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Document uploaded successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Document uploaded successfully. It will be reviewed by an admin.',
        },
        documentId: { type: 'string', example: 'uuid-string' },
        documentType: { type: 'string', example: 'house' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          example: 'PENDING',
        },
        uploadedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or document type' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadCollateralDocument(
    @GetUser() user: any,
    @Body() uploadCollateralDto: UploadCollateralDto,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    const documentUrl = file ? `/uploads/${file.filename}` : '';
    return this.authService.uploadCollateralDocument(
      user.id,
      uploadCollateralDto.documentType,
      documentUrl,
    );
  }

  @Get('collateral/documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get collateral documents',
    description:
      'Get all collateral documents uploaded by the authenticated user with their verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of collateral documents',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          documentType: {
            type: 'string',
            enum: ['house', 'car'],
            example: 'house',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            example: 'PENDING',
          },
          uploadedAt: { type: 'string', format: 'date-time' },
          documentUrl: {
            type: 'string',
            example: 'https://example.com/documents/uuid.pdf',
            nullable: true,
          },
          rejectionReason: {
            type: 'string',
            example: 'Document quality too low',
            nullable: true,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCollateralDocuments(@GetUser() user: any) {
    return this.authService.getCollateralDocuments(user.id);
  }

  @Post('user/check-email')
  @ApiOperation({
    summary: 'Check if user exists by email',
    description:
      'Check if a user exists by email address and return their public profile information if found. This endpoint is public and does not require authentication.',
  })
  @ApiBody({ type: CheckUserByEmailDto })
  @ApiResponse({
    status: 200,
    description: 'User lookup result',
    schema: {
      type: 'object',
      properties: {
        exists: {
          type: 'boolean',
          example: true,
          description: 'Whether the user exists',
        },
        user: {
          type: 'object',
          nullable: true,
          properties: {
            id: { type: 'string', example: 'uuid-string' },
            firstName: { type: 'string', example: 'Ahmed' },
            lastName: { type: 'string', example: 'Hassan' },
            email: { type: 'string', example: 'user@example.com' },
            photoUrl: {
              type: 'string',
              example: 'https://example.com/photo.jpg',
              nullable: true,
            },
            creditScore: { type: 'number', example: 500 },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid email format' })
  async checkUserByEmail(@Body(ValidationPipe) checkUserDto: CheckUserByEmailDto) {
    return this.authService.checkUserByEmail(checkUserDto.email);
  }
}

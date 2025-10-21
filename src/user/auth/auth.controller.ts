import { Controller, Post, Get, Body, ValidationPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, InitiateRegisterDto } from '../dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
}

import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, InitiateRegisterDto } from '../dto/auth.dto';

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
}

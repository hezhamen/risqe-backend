import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PhoneService } from './phone.service';
import { RequestOtpDto, VerifyOtpDto } from './phone.dto';

@ApiTags('Authentication')
@Controller('auth/phone')
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  @Post('request')
  @ApiOperation({ 
    summary: 'Request OTP for phone verification',
    description: 'Send an OTP code to the provided phone number for verification'
  })
  @ApiBody({ type: RequestOtpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP request successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        provider: { type: 'string', enum: ['namabar', 'dev'], example: 'namabar' },
        verificationId: { type: 'string', example: '68f389fe7c3e004536e0efb0' },
        devCode: { type: 'string', example: '123456', description: 'Only returned in development mode' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid phone number format' })
  async request(@Body(ValidationPipe) dto: RequestOtpDto) {
    return this.phoneService.requestOtp(dto.phoneNumber);
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Verify OTP code',
    description: 'Verify the OTP code sent to the phone number and complete user registration'
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'OTP verification successful',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  async verify(@Body(ValidationPipe) dto: VerifyOtpDto) {
    return this.phoneService.verifyOtp(dto.phoneNumber, dto.code);
  }
}



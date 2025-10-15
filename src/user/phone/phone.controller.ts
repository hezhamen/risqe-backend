import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PhoneService } from './phone.service';
import { RequestOtpDto, VerifyOtpDto } from './phone.dto';

@ApiTags('phone-auth')
@Controller('auth/phone')
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request OTP to phone number' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  async request(@Body(ValidationPipe) dto: RequestOtpDto) {
    return this.phoneService.requestOtp(dto.phoneNumber);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify OTP and return JWT' })
  @ApiOkResponse({ schema: { example: { access_token: 'jwt.token.here' } } })
  async verify(@Body(ValidationPipe) dto: VerifyOtpDto) {
    return this.phoneService.verifyOtp(dto.phoneNumber, dto.code);
  }
}



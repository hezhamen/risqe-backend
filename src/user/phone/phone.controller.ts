import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { PhoneService } from './phone.service';
import { RequestOtpDto, VerifyOtpDto } from './phone.dto';

@Controller('auth/phone')
export class PhoneController {
  constructor(private readonly phoneService: PhoneService) {}

  @Post('request')
  async request(@Body(ValidationPipe) dto: RequestOtpDto) {
    return this.phoneService.requestOtp(dto.phoneNumber);
  }

  @Post('verify')
  async verify(@Body(ValidationPipe) dto: VerifyOtpDto) {
    return this.phoneService.verifyOtp(dto.phoneNumber, dto.code);
  }
}



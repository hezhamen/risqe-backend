import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user.entity';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class PhoneService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async requestOtp(phoneNumber: string): Promise<{ success: true; provider?: 'namabar' | 'dev'; verificationId?: string; devCode?: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    let user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      user = this.userRepository.create({
        email: `${phoneNumber}@placeholder.local`,
        passwordHash: '',
        phoneNumber,
        isPhoneVerified: false,
      });
    }

    user.phoneOtpCode = code;
    user.phoneOtpExpiresAt = expiresAt;
    await this.userRepository.save(user);

    // Send via Namabar (if configured)
    const apiKey = process.env.NAMABAR_API_KEY;
    const serviceId = process.env.NAMABAR_VERIFY_SERVICE_ID;
    const apiUrl = process.env.NAMABAR_API_URL || 'https://api.namabar.krd';
    
    if (apiKey && serviceId) {
      try {
        const requestData = {
          to: phoneNumber,
          serviceId,
        };
        const requestHeaders = { 
          'X-Api-Key': apiKey, 
          'Content-Type': 'application/json' 
        };
        
        const resp = await this.httpService.axiosRef.post(
          `${apiUrl}/v1/verification-codes`,
          requestData,
          { headers: requestHeaders },
        );
        
        const verificationId = resp.data?.id;
        if (verificationId) {
          user.namabarVerificationId = verificationId;
          await this.userRepository.save(user);
          return { success: true, provider: 'namabar', verificationId };
        }
      } catch (err) {
        Logger.error(`Namabar SMS failed: ${err.message}`, 'PhoneService');
      }
    }
    
    // Development/fallback mode - return the code for testing
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      return { success: true, provider: 'dev', devCode: code };
    }
    
    return { success: true };
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<{ access_token: string }> {
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new BadRequestException('Invalid code');
    }

    let valid = false;
    const apiKey = process.env.NAMABAR_API_KEY;
    const apiUrl = process.env.NAMABAR_API_URL || 'https://api.namabar.krd';
    
    // Prefer Namabar verify if we have an id and API key
    if (apiKey && user.namabarVerificationId) {
      try {
        await this.httpService.axiosRef.post(
          `${apiUrl}/v1/verification-codes/${user.namabarVerificationId}/verify`,
          { code },
          { headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' } },
        );
        valid = true;
      } catch (err) {
        Logger.error(`Namabar verification failed: ${err.message}`, 'PhoneService');
        valid = false;
      }
    }
    
    // Fallback to local verification if Namabar fails or not configured
    if (!valid) {
      if (!user.phoneOtpCode || !user.phoneOtpExpiresAt) {
        throw new BadRequestException('Invalid code');
      }
      if (user.phoneOtpCode !== code || user.phoneOtpExpiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Invalid or expired code');
      }
      valid = true;
    }

    if (!valid) {
      throw new BadRequestException('Invalid code');
    }

    // Mark phone as verified and clean up OTP data
    user.isPhoneVerified = true;
    user.phoneOtpCode = null;
    user.phoneOtpExpiresAt = null;
    user.namabarVerificationId = null;
    await this.userRepository.save(user);

    // Issue JWT
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}



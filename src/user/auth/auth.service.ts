import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { RegisterDto, LoginDto, InitiateRegisterDto } from '../dto/auth.dto';
import { PhoneService } from '../phone/phone.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly phoneService: PhoneService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { phoneNumber, firstName, lastName, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });
    if (existingUser) {
      throw new ConflictException('User already exists with this phone number');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = this.userRepository.create({
      phoneNumber,
      firstName,
      lastName,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Generate JWT token
    const payload = { phoneNumber: savedUser.phoneNumber, sub: savedUser.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async initiateRegistration(initiateRegisterDto: InitiateRegisterDto): Promise<{
    success: boolean;
    phoneNumber: string;
    provider?: 'namabar' | 'dev';
    verificationId?: string;
    devCode?: string;
  }> {
    const { phoneNumber, firstName, lastName, password } = initiateRegisterDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser && existingUser.isPhoneVerified) {
      throw new ConflictException('User already exists with this phone number');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    let user: User;
    if (existingUser) {
      // Update existing unverified user
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.passwordHash = passwordHash;
      user = await this.userRepository.save(existingUser);
    } else {
      // Create new unverified user
      const newUser = this.userRepository.create({
        phoneNumber,
        firstName,
        lastName,
        passwordHash,
        isPhoneVerified: false,
      });
      user = await this.userRepository.save(newUser);
    }

    // Send OTP
    const otpResult = await this.phoneService.requestOtp(phoneNumber);

    return {
      phoneNumber,
      ...otpResult,
    };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { phoneNumber, password } = loginDto;

    // Find user by phone number
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { phoneNumber: user.phoneNumber, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async validateUser(phoneNumber: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { phoneNumber } });
  }
}

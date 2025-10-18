import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string }> {
    const { phoneNumber, firstName, lastName, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { phoneNumber } });
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

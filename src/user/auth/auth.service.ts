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
    const { email, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = this.userRepository.create({
      email,
      passwordHash,
    });

    const savedUser = await this.userRepository.save(newUser);

    // Generate JWT token
    const payload = { email: savedUser.email, sub: savedUser.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string }> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }

  async validateUser(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }
}

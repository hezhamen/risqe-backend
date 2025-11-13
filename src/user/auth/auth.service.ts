import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import * as bcrypt from 'bcrypt';
import { User } from '../user.entity';
import {
  RegisterDto,
  LoginDto,
  InitiateRegisterDto,
  ForgotPasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  RequestPhoneChangeDto,
  VerifyPhoneChangeDto,
} from '../dto/auth.dto';
import { PhoneService } from '../phone/phone.service';
import { CollateralDocument } from '../collateral-document.entity';

export interface UserProfileResponse {
  id: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  photoUrl?: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CollateralDocument)
    private collateralDocumentRepository: Repository<CollateralDocument>,
    private readonly jwtService: JwtService,
    private readonly phoneService: PhoneService,
    private readonly httpService: HttpService,
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

  async getProfile(phoneNumber: string): Promise<
    UserProfileResponse & {
      internalBalance: number;
      pointsBalance: number;
      creditScore: number;
      isPhoneVerified: boolean;
    }
  > {
    const user = await this.userRepository.findOne({ where: { phoneNumber } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      photoUrl: user.photoUrl,
      internalBalance: user.internalBalance,
      pointsBalance: user.pointsBalance,
      creditScore: user.creditScore,
      isPhoneVerified: user.isPhoneVerified,
    };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{
    success: boolean;
    message: string;
    provider?: 'namabar' | 'dev';
    verificationId?: string;
    devCode?: string;
  }> {
    const { phoneNumber } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { phoneNumber },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const otpResult = await this.phoneService.requestOtp(phoneNumber);

    return {
      ...otpResult,
      message: 'Password reset OTP sent to your phone',
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateProfileDto.firstName !== undefined) {
      if (updateProfileDto.firstName.trim().length === 0) {
        throw new BadRequestException('First name cannot be empty');
      }
      user.firstName = updateProfileDto.firstName.trim();
    }
    if (updateProfileDto.lastName !== undefined) {
      if (updateProfileDto.lastName.trim().length === 0) {
        throw new BadRequestException('Last name cannot be empty');
      }
      user.lastName = updateProfileDto.lastName.trim();
    }
    if (updateProfileDto.email !== undefined) {
      const trimmedEmail = updateProfileDto.email.trim();
      if (trimmedEmail.length === 0) {
        user.email = null;
      } else {
        const existingUser = await this.userRepository.findOne({
          where: { email: trimmedEmail },
        });
        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Email address already in use');
        }
        user.email = trimmedEmail;
      }
    }
    if (updateProfileDto.photoUrl !== undefined) {
      user.photoUrl = updateProfileDto.photoUrl.trim() || null;
    }

    const updatedUser = await this.userRepository.save(user);

    return {
      id: updatedUser.id,
      phoneNumber: updatedUser.phoneNumber,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      photoUrl: updatedUser.photoUrl,
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ success: boolean; message: string }> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    user.passwordHash = newPasswordHash;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async requestPhoneChangeOtp(
    userId: string,
    requestPhoneChangeDto: RequestPhoneChangeDto,
  ): Promise<{
    success: boolean;
    message: string;
    provider?: 'namabar' | 'dev';
    verificationId?: string;
    devCode?: string;
  }> {
    const { newPhoneNumber } = requestPhoneChangeDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber: newPhoneNumber },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Phone number already in use');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.pendingPhoneNumber = newPhoneNumber;
    user.pendingPhoneOtpCode = code;
    user.pendingPhoneOtpExpiresAt = expiresAt;
    await this.userRepository.save(user);

    const apiKey = process.env.NAMABAR_API_KEY;
    const serviceId = process.env.NAMABAR_VERIFY_SERVICE_ID;
    const apiUrl = process.env.NAMABAR_API_URL || 'https://api.namabar.krd';

    if (apiKey && serviceId) {
      try {
        const requestData = {
          to: newPhoneNumber,
          serviceId,
        };
        const requestHeaders = {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        };

        const resp = await this.httpService.axiosRef.post(
          `${apiUrl}/v1/verification-codes`,
          requestData,
          { headers: requestHeaders },
        );

        const verificationId = resp.data?.id;
        if (verificationId) {
          return {
            success: true,
            message: 'OTP sent to new phone number',
            provider: 'namabar',
            verificationId,
          };
        }
      } catch (err) {
        // Fall through to dev mode
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      return {
        success: true,
        message: 'OTP sent to new phone number',
        provider: 'dev',
        devCode: code,
      };
    }

    return {
      success: true,
      message: 'OTP sent to new phone number',
    };
  }

  async verifyPhoneChange(
    userId: string,
    verifyPhoneChangeDto: VerifyPhoneChangeDto,
  ): Promise<{
    success: boolean;
    message: string;
    phoneNumber: string;
  }> {
    const { newPhoneNumber, code } = verifyPhoneChangeDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.pendingPhoneNumber !== newPhoneNumber) {
      throw new BadRequestException('Phone number mismatch');
    }

    if (
      !user.pendingPhoneOtpCode ||
      user.pendingPhoneOtpCode !== code ||
      !user.pendingPhoneOtpExpiresAt ||
      user.pendingPhoneOtpExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber: newPhoneNumber },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException('Phone number already in use');
    }

    user.phoneNumber = newPhoneNumber;
    user.isPhoneVerified = true;
    user.pendingPhoneNumber = null;
    user.pendingPhoneOtpCode = null;
    user.pendingPhoneOtpExpiresAt = null;
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Phone number updated successfully',
      phoneNumber: newPhoneNumber,
    };
  }

  async uploadCollateralDocument(
    userId: string,
    documentType: 'house' | 'car',
    documentUrl: string,
  ): Promise<{
    success: boolean;
    message: string;
    documentId: string;
    documentType: string;
    status: string;
    uploadedAt: Date;
  }> {
    const document = this.collateralDocumentRepository.create({
      userId,
      documentType,
      documentUrl,
      status: 'PENDING',
    });

    const savedDocument = await this.collateralDocumentRepository.save(
      document,
    );

    return {
      success: true,
      message: 'Document uploaded successfully. It will be reviewed by an admin.',
      documentId: savedDocument.id,
      documentType: savedDocument.documentType,
      status: savedDocument.status,
      uploadedAt: savedDocument.uploadedAt,
    };
  }

  async getCollateralDocuments(userId: string): Promise<CollateralDocument[]> {
    return await this.collateralDocumentRepository.find({
      where: { userId },
      order: { uploadedAt: 'DESC' },
    });
  }

  async checkUserByEmail(email: string): Promise<{
    exists: boolean;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      photoUrl?: string | null;
      creditScore: number;
    };
  }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      return { exists: false };
    }

    return {
      exists: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email || email,
        photoUrl: user.photoUrl,
        creditScore: user.creditScore,
      },
    };
  }

  async searchUser(query: string): Promise<
    Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phoneNumber: string;
      photoUrl: string | null;
      creditScore: number;
      hasAccount: boolean;
    }>
  > {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    // Detect search type
    if (trimmedQuery.includes('@')) {
      // Email search - exact match or contains
      const users = await this.userRepository.find({
        where: { email: ILike(`%${trimmedQuery}%`) },
        take: 10,
      });

      return users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber,
        photoUrl: user.photoUrl ?? null,
        creditScore: user.creditScore,
        hasAccount: true,
      }));
    }

    // Check if it's a phone number (digits with optional + prefix)
    const phonePattern = /^\+?[0-9\s-]+$/;
    const normalizedPhone = trimmedQuery.replace(/[\s-]/g, '');
    if (phonePattern.test(normalizedPhone)) {
      // Phone search - normalize and match
      const phoneToSearch = normalizedPhone.startsWith('+')
        ? normalizedPhone
        : `+${normalizedPhone}`;

      const user = await this.userRepository.findOne({
        where: { phoneNumber: phoneToSearch },
      });

      if (!user) {
        return [];
      }

      return [
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email ?? null,
          phoneNumber: user.phoneNumber,
          photoUrl: user.photoUrl ?? null,
          creditScore: user.creditScore,
          hasAccount: true,
        },
      ];
    }

    // Name search - requires at least 2 characters
    if (trimmedQuery.length < 2) {
      return [];
    }

    // Search in firstName, lastName, or full name
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.firstName ILIKE :query', { query: `%${trimmedQuery}%` })
      .orWhere('user.lastName ILIKE :query', { query: `%${trimmedQuery}%` })
      .orWhere("CONCAT(user.firstName, ' ', user.lastName) ILIKE :query", {
        query: `%${trimmedQuery}%`,
      })
      .limit(10)
      .getMany();

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email ?? null,
      phoneNumber: user.phoneNumber,
      photoUrl: user.photoUrl ?? null,
      creditScore: user.creditScore,
      hasAccount: true,
    }));
  }

  async checkUserByPhone(phoneNumber: string): Promise<{
    exists: boolean;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phoneNumber: string;
      photoUrl: string | null;
      creditScore: number;
      hasAccount: boolean;
    };
    message?: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (!user) {
      throw new NotFoundException({
        exists: false,
        message: 'User not found',
      });
    }

    return {
      exists: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email ?? null,
        phoneNumber: user.phoneNumber,
        photoUrl: user.photoUrl ?? null,
        creditScore: user.creditScore,
        hasAccount: true,
      },
    };
  }
}

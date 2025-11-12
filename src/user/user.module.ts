import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { User } from './user.entity';
import { CollateralDocument } from './collateral-document.entity';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { PhoneController } from './phone/phone.controller';
import { PhoneService } from './phone/phone.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, CollateralDocument]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    HttpModule,
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy, PhoneService],
  controllers: [AuthController, PhoneController],
  exports: [AuthService, JwtAuthGuard],
})
export class UserModule {}

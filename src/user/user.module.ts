import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './auth/jwt.strategy';
import { User } from './user.entity';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
  ],
  providers: [AuthService, JwtAuthGuard, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedeemService } from './redeem/redeem.service';
import { RedeemController } from './redeem/redeem.controller';
import { Coupon, UserCoupon } from './coupon.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, UserCoupon, User]),
    UserModule,
  ],
  providers: [RedeemService],
  controllers: [RedeemController],
  exports: [RedeemService],
})
export class RedeemModule {}

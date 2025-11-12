import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, UserCoupon } from '../coupon.entity';
import { User } from '../../user/user.entity';

@Injectable()
export class RedeemService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private userCouponRepository: Repository<UserCoupon>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getCoupons(userId: string): Promise<
    Array<{
      id: string;
      title: string;
      subtitle?: string | null;
      cost: number;
      redeemed: boolean;
      redeemedAt?: Date | null;
      expiresAt?: Date | null;
      imageUrl?: string | null;
    }>
  > {
    const coupons = await this.couponRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });

    const userCoupons = await this.userCouponRepository.find({
      where: { userId },
    });

    const redeemedCouponIds = new Set(
      userCoupons.map((uc) => uc.couponId),
    );

    return coupons.map((coupon) => {
      const userCoupon = userCoupons.find((uc) => uc.couponId === coupon.id);
      return {
        id: coupon.id,
        title: coupon.title,
        subtitle: coupon.subtitle,
        cost: coupon.cost,
        redeemed: redeemedCouponIds.has(coupon.id),
        redeemedAt: userCoupon?.redeemedAt || null,
        expiresAt: coupon.expiresAt,
        imageUrl: coupon.imageUrl,
      };
    });
  }

  async redeemCoupon(
    userId: string,
    couponId: string,
  ): Promise<{
    success: boolean;
    message: string;
    couponId: string;
    pointsRemaining: number;
    redemptionCode: string;
  }> {
    const coupon = await this.couponRepository.findOne({
      where: { id: couponId, isActive: true },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Coupon has expired');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRedemption = await this.userCouponRepository.findOne({
      where: { userId, couponId },
    });

    if (existingRedemption) {
      throw new BadRequestException('Coupon already redeemed');
    }

    if (user.pointsBalance < coupon.cost) {
      throw new BadRequestException('Insufficient points');
    }

    const redemptionCode = `REDEEM-${Date.now().toString(36).toUpperCase()}`;

    user.pointsBalance -= coupon.cost;
    await this.userRepository.save(user);

    const userCoupon = this.userCouponRepository.create({
      userId,
      couponId,
      redemptionCode,
    });
    await this.userCouponRepository.save(userCoupon);

    return {
      success: true,
      message: 'Coupon redeemed successfully',
      couponId: coupon.id,
      pointsRemaining: user.pointsBalance,
      redemptionCode,
    };
  }
}

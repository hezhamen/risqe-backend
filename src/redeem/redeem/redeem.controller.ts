import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RedeemService } from './redeem.service';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('Redeem')
@ApiBearerAuth('JWT-auth')
@Controller('redeem')
@UseGuards(JwtAuthGuard)
export class RedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Get('coupons')
  @ApiOperation({
    summary: 'Get available coupons',
    description: 'Get all available coupons that can be redeemed with points. Includes redeemed and available coupons.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of coupons',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          title: { type: 'string', example: 'Get 2 Burgers for free' },
          subtitle: { type: 'string', example: 'Bees Restaurant' },
          cost: {
            type: 'number',
            description: 'Points required to redeem',
            example: 250,
          },
          redeemed: { type: 'boolean', example: false },
          redeemedAt: { type: 'string', format: 'date-time', nullable: true },
          expiresAt: { type: 'string', format: 'date-time', nullable: true },
          imageUrl: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/coupon-image.jpg',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCoupons(@GetUser() user: any) {
    return this.redeemService.getCoupons(user.id);
  }

  @Post('coupons/:id')
  @ApiOperation({
    summary: 'Redeem a coupon',
    description: "Redeem a coupon using user's points. Deducts the coupon cost from user's points balance.",
  })
  @ApiParam({
    name: 'id',
    description: 'Coupon ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Coupon redeemed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Coupon redeemed successfully' },
        couponId: { type: 'string', example: 'uuid-string' },
        pointsRemaining: { type: 'number', example: 4170 },
        redemptionCode: { type: 'string', example: 'REDEEM-ABC123' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - insufficient points, coupon already redeemed, or coupon expired',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Coupon not found' })
  async redeemCoupon(@GetUser() user: any, @Param('id') couponId: string) {
    return this.redeemService.redeemCoupon(user.id, couponId);
  }
}

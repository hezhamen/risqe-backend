import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth('JWT-auth')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user notifications',
    description:
      'Get all notifications for the authenticated user. Supports filtering by type (all, payments due, voting due).',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['all', 'payments_due', 'voting_due'],
    example: 'all',
    description: 'Filter notifications by type',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 50,
    description: 'Maximum number of notifications to return',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    example: 0,
    description: 'Number of notifications to skip',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
    schema: {
      type: 'object',
      properties: {
        notifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-string' },
              type: {
                type: 'string',
                enum: [
                  'PAYMENT_DUE',
                  'VOTING_DUE',
                  'GROUP_INVITATION',
                  'PAYMENT_RECEIVED',
                  'VOTE_RESULT',
                ],
                example: 'PAYMENT_DUE',
              },
              title: { type: 'string', example: 'Payment Due' },
              message: {
                type: 'string',
                example: 'Your payment for group Peshkawtn is due',
              },
              time: { type: 'string', example: '2 hours ago' },
              createdAt: { type: 'string', format: 'date-time' },
              read: { type: 'boolean', example: false },
              groupId: { type: 'string', example: 'uuid-string', nullable: true },
              actionUrl: {
                type: 'string',
                example: '/rosca/groups/uuid-string',
                nullable: true,
              },
            },
          },
        },
        total: { type: 'number', example: 25 },
        unreadCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @GetUser() user: any,
    @Query('type') type?: 'all' | 'payments_due' | 'voting_due',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      type || 'all',
      limit ? parseInt(limit.toString(), 10) : 50,
      offset ? parseInt(offset.toString(), 10) : 0,
    );
  }
}

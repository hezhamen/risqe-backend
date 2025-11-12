import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import {
  CreateWithdrawalRequestDto,
  ProcessTransactionDto,
  CreateDepositDto,
} from '../dto/financial.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('Financials')
@ApiBearerAuth('JWT-auth')
@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post('deposits')
  @ApiOperation({
    summary: 'Create deposit (top up balance)',
    description: 'Create a deposit to top up the authenticated user\'s internal balance',
  })
  @ApiBody({ type: CreateDepositDto })
  @ApiResponse({
    status: 201,
    description: 'Deposit created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        type: { type: 'string', example: 'DEPOSIT' },
        amount: { type: 'number', example: 50000 },
        status: { type: 'string', example: 'COMPLETED' },
        createdAt: { type: 'string', format: 'date-time' },
        newBalance: {
          type: 'number',
          example: 150000,
          description: 'User\'s new balance after deposit',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createDeposit(
    @GetUser() user: any,
    @Body(ValidationPipe) createDepositDto: CreateDepositDto,
  ) {
    return this.financialsService.createDeposit(user.id, createDepositDto);
  }

  @Post('withdrawals')
  @ApiOperation({
    summary: 'Create withdrawal request',
    description: 'Create a new withdrawal request for the authenticated user',
  })
  @ApiBody({ type: CreateWithdrawalRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal request created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        amount: { type: 'number', example: 25.0 },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'REJECTED'],
          example: 'PENDING',
        },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createWithdrawalRequest(
    @GetUser() user: any,
    @Body(ValidationPipe) createWithdrawalDto: CreateWithdrawalRequestDto,
  ) {
    return this.financialsService.createWithdrawalRequest(
      user.id,
      createWithdrawalDto,
    );
  }

  @Post('withdrawals/:id/process')
  @ApiOperation({
    summary: 'Process withdrawal request',
    description: 'Process a withdrawal request (approve or reject)',
  })
  @ApiParam({
    name: 'id',
    description: 'Withdrawal request ID',
    example: 'uuid-string',
  })
  @ApiBody({ type: ProcessTransactionDto })
  @ApiResponse({
    status: 200,
    description: 'Withdrawal request processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Withdrawal request processed' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  async processWithdrawalRequest(
    @Param('id') withdrawalId: string,
    @Body(ValidationPipe) processTransactionDto: ProcessTransactionDto,
  ) {
    return this.financialsService.processWithdrawalRequest(
      withdrawalId,
      processTransactionDto,
    );
  }

  @Get('withdrawals')
  @ApiOperation({
    summary: 'Get user withdrawal requests',
    description: 'Retrieve all withdrawal requests for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user withdrawal requests',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          amount: { type: 'number', example: 25.0 },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            example: 'PENDING',
          },
          paymentMethod: { type: 'string', example: 'BANK_TRANSFER' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserWithdrawalRequests(@GetUser() user: any) {
    return this.financialsService.getUserWithdrawalRequests(user.id);
  }

  @Get('transactions')
  @ApiOperation({
    summary: 'Get user transactions (enhanced)',
    description:
      'Get all financial transactions for the authenticated user with enhanced details including group-related transactions.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user transactions with enhanced details',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-string' },
              type: {
                type: 'string',
                enum: ['DEPOSIT', 'WITHDRAWAL', 'GROUP_PAYMENT', 'GROUP_PAYOUT', 'TRANSFER'],
                example: 'DEPOSIT',
              },
              title: {
                type: 'string',
                description: 'Human-readable transaction title',
                example: 'Balance Topped Up',
              },
              message: {
                type: 'string',
                description: 'Detailed transaction message',
                example: 'You added 50,000 IQD to your balance',
              },
              amount: {
                type: 'number',
                description: 'Transaction amount in IQD',
                example: 50000,
              },
              status: {
                type: 'string',
                enum: ['PENDING', 'COMPLETED', 'FAILED'],
                example: 'COMPLETED',
              },
              groupId: {
                type: 'string',
                nullable: true,
                description: 'Group ID (for GROUP_PAYMENT and GROUP_PAYOUT types)',
                example: 'uuid-string',
              },
              groupName: {
                type: 'string',
                nullable: true,
                description: 'Group name (for GROUP_PAYMENT and GROUP_PAYOUT types)',
                example: 'Peshkawtn',
              },
              paymentMethod: {
                type: 'string',
                nullable: true,
                description: 'Payment method (for WITHDRAWAL type)',
                enum: ['BANK_TRANSFER', 'CASH', 'MOBILE_MONEY'],
                example: 'BANK_TRANSFER',
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:30:00Z',
              },
              time: {
                type: 'string',
                description: 'Human-readable time string (e.g., "2 hours ago", "1 day ago")',
                example: '2 hours ago',
              },
            },
          },
        },
        total: {
          type: 'number',
          description: 'Total number of transactions',
          example: 100,
        },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTransactions(
    @GetUser() user: any,
    @Query('type') type?: 'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'GROUP_PAYMENT' | 'GROUP_PAYOUT' | 'TRANSFER',
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.financialsService.getUserTransactions(
      user.id,
      type || 'all',
      limit ? parseInt(limit.toString(), 10) : 50,
      offset ? parseInt(offset.toString(), 10) : 0,
    );
  }
}

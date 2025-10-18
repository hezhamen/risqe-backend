import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
} from '../dto/financial.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('Financials')
@ApiBearerAuth('JWT-auth')
@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

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
    summary: 'Get user transactions',
    description:
      'Retrieve all financial transactions for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user transactions',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          amount: { type: 'number', example: 25.0 },
          type: {
            type: 'string',
            enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'],
            example: 'DEPOSIT',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'FAILED'],
            example: 'COMPLETED',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTransactions(@GetUser() user: any) {
    return this.financialsService.getUserTransactions(user.id);
  }
}

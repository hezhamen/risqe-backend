import { Controller, Post, Get, Body, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { FinancialsService } from './financials.service';
import { CreateWithdrawalRequestDto, ProcessTransactionDto } from '../dto/financial.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('financials')
@ApiBearerAuth()
@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post('withdrawals')
  @ApiOperation({
    summary: 'Create withdrawal request',
    description:
      'Creates a pending withdrawal request.\n\n' +
      'Example:\n' +
      '\`\`\`json\n{\n  "amount": 25,\n  "paymentMethod": "BANK_TRANSFER",\n  "paymentDetails": "{\\"iban\\":\\"DE89 3704 0044 0532 0130 00\\"}"\n}\n\`\`\`',
  })
  @ApiCreatedResponse({ description: 'Withdrawal created', schema: { example: { id: 'uuid', amount: 25, status: 'PENDING' } } })
  async createWithdrawalRequest(
    @GetUser() user: any,
    @Body(ValidationPipe) createWithdrawalDto: CreateWithdrawalRequestDto,
  ) {
    return this.financialsService.createWithdrawalRequest(user.id, createWithdrawalDto);
  }

  @Post('withdrawals/:id/process')
  async processWithdrawalRequest(
    @Param('id') withdrawalId: string,
    @Body(ValidationPipe) processTransactionDto: ProcessTransactionDto,
  ) {
    return this.financialsService.processWithdrawalRequest(withdrawalId, processTransactionDto);
  }

  @Get('withdrawals')
  @ApiOperation({ summary: 'List user withdrawal requests' })
  @ApiOkResponse({ description: 'List withdrawals', schema: { example: [{ id: 'uuid', amount: 25, status: 'PENDING' }] } })
  async getUserWithdrawalRequests(@GetUser() user: any) {
    return this.financialsService.getUserWithdrawalRequests(user.id);
  }

  @Get('transactions')
  async getUserTransactions(@GetUser() user: any) {
    return this.financialsService.getUserTransactions(user.id);
  }
}

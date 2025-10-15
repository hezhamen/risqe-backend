import { Controller, Post, Get, Body, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { CreateWithdrawalRequestDto, ProcessTransactionDto } from '../dto/financial.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@Controller('financials')
@UseGuards(JwtAuthGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  @Post('withdrawals')
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
  async getUserWithdrawalRequests(@GetUser() user: any) {
    return this.financialsService.getUserWithdrawalRequests(user.id);
  }

  @Get('transactions')
  async getUserTransactions(@GetUser() user: any) {
    return this.financialsService.getUserTransactions(user.id);
  }
}

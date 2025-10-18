import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GroupTransaction } from '../group-transaction.entity';
import { WithdrawalRequest } from '../withdrawal-request.entity';
import { User } from '../../user/user.entity';
import {
  CreateWithdrawalRequestDto,
  ProcessTransactionDto,
} from '../dto/financial.dto';

@Injectable()
export class FinancialsService {
  constructor(
    @InjectRepository(GroupTransaction)
    private transactionRepository: Repository<GroupTransaction>,
    @InjectRepository(WithdrawalRequest)
    private withdrawalRepository: Repository<WithdrawalRequest>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly httpService: HttpService,
  ) {}

  async createWithdrawalRequest(
    userId: string,
    createWithdrawalDto: CreateWithdrawalRequestDto,
  ): Promise<WithdrawalRequest> {
    // Verify user exists and has sufficient balance
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.internalBalance < createWithdrawalDto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create withdrawal request
    const withdrawalRequest = this.withdrawalRepository.create({
      userId,
      ...createWithdrawalDto,
    });

    return await this.withdrawalRepository.save(withdrawalRequest);
  }

  async processWithdrawalRequest(
    withdrawalId: string,
    processTransactionDto: ProcessTransactionDto,
  ): Promise<WithdrawalRequest> {
    const withdrawalRequest = await this.withdrawalRepository.findOne({
      where: { id: withdrawalId },
      relations: ['user'],
    });

    if (!withdrawalRequest) {
      throw new NotFoundException('Withdrawal request not found');
    }

    if (withdrawalRequest.status !== 'PENDING') {
      throw new BadRequestException('Withdrawal request already processed');
    }

    // Process the external payment
    try {
      const externalResult = await this.processExternalPayment(
        withdrawalRequest,
        processTransactionDto,
      );

      // Update withdrawal request status
      withdrawalRequest.status = processTransactionDto.status;
      withdrawalRequest.externalTransactionId =
        processTransactionDto.externalTransactionId || null;
      withdrawalRequest.processedAt = new Date();

      if (processTransactionDto.status === 'FAILED') {
        withdrawalRequest.failureReason =
          processTransactionDto.failureReason || null;
      } else if (processTransactionDto.status === 'COMPLETED') {
        // Deduct from user balance if successful
        await this.userRepository.decrement(
          { id: withdrawalRequest.userId },
          'internalBalance',
          withdrawalRequest.amount,
        );
      }

      return await this.withdrawalRepository.save(withdrawalRequest);
    } catch (error) {
      throw new BadRequestException('Failed to process withdrawal');
    }
  }

  async getUserWithdrawalRequests(
    userId: string,
  ): Promise<WithdrawalRequest[]> {
    return await this.withdrawalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async getUserTransactions(userId: string): Promise<GroupTransaction[]> {
    return await this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['group', 'user'],
    });
  }

  private async processExternalPayment(
    withdrawalRequest: WithdrawalRequest,
    processDto: ProcessTransactionDto,
  ): Promise<any> {
    // This would integrate with external payment APIs
    // For now, we'll simulate the API call

    const paymentData = {
      amount: withdrawalRequest.amount,
      paymentMethod: withdrawalRequest.paymentMethod,
      paymentDetails: JSON.parse(withdrawalRequest.paymentDetails),
    };

    try {
      // Simulate external API call
      // const response = await firstValueFrom(
      //   this.httpService.post('https://external-payment-api.com/process', paymentData)
      // );

      // For demo purposes, we'll simulate success/failure
      if (Math.random() > 0.1) {
        // 90% success rate
        return {
          success: true,
          transactionId: `ext_${Date.now()}`,
        };
      } else {
        throw new Error('External payment failed');
      }
    } catch (error) {
      throw new BadRequestException('External payment processing failed');
    }
  }
}

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

  async getUserTransactions(
    userId: string,
    type?: 'all' | 'DEPOSIT' | 'WITHDRAWAL' | 'GROUP_PAYMENT' | 'GROUP_PAYOUT' | 'TRANSFER',
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    transactions: Array<{
      id: string;
      type: string;
      title: string;
      message: string;
      amount: number;
      status: string;
      groupId?: string | null;
      groupName?: string | null;
      paymentMethod?: string | null;
      createdAt: Date;
      time: string;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const where: any = { userId };

    if (type && type !== 'all') {
      if (type === 'GROUP_PAYMENT' || type === 'GROUP_PAYOUT') {
        where.type = type === 'GROUP_PAYMENT' ? 'PAYMENT' : 'PAYOUT';
      } else {
        where.type = type;
      }
    }

    const [transactions, total] = await this.transactionRepository.findAndCount({
      where,
      relations: ['group', 'user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const formatTimeAgo = (date: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    const getTransactionTitle = (transactionType: string): string => {
      switch (transactionType) {
        case 'DEPOSIT':
          return 'Balance Topped Up';
        case 'WITHDRAWAL':
          return 'Withdrawal';
        case 'PAYMENT':
          return 'Group Payment';
        case 'PAYOUT':
          return 'Group Payout';
        case 'TRANSFER':
          return 'Transfer';
        default:
          return 'Transaction';
      }
    };

    const getTransactionMessage = (
      transactionType: string,
      amount: number,
      groupName?: string | null,
    ): string => {
      switch (transactionType) {
        case 'DEPOSIT':
          return `You added ${amount.toLocaleString()} IQD to your balance`;
        case 'WITHDRAWAL':
          return `You withdrew ${amount.toLocaleString()} IQD`;
        case 'PAYMENT':
          return groupName
            ? `You paid ${amount.toLocaleString()} IQD to group ${groupName}`
            : `You paid ${amount.toLocaleString()} IQD to a group`;
        case 'PAYOUT':
          return groupName
            ? `You received ${amount.toLocaleString()} IQD from group ${groupName}`
            : `You received ${amount.toLocaleString()} IQD from a group`;
        case 'TRANSFER':
          return `You transferred ${amount.toLocaleString()} IQD`;
        default:
          return `Transaction of ${amount.toLocaleString()} IQD`;
      }
    };

    const formattedTransactions = transactions.map((transaction) => {
      const transactionType =
        transaction.type === 'PAYMENT'
          ? 'GROUP_PAYMENT'
          : transaction.type === 'PAYOUT'
            ? 'GROUP_PAYOUT'
            : transaction.type;

      return {
        id: transaction.id,
        type: transactionType,
        title: getTransactionTitle(transaction.type),
        message: getTransactionMessage(
          transaction.type,
          transaction.amount,
          transaction.group?.name,
        ),
        amount: transaction.amount,
        status: transaction.status,
        groupId: transaction.groupId || null,
        groupName: transaction.group?.name || null,
        paymentMethod: null,
        createdAt: transaction.createdAt,
        time: formatTimeAgo(transaction.createdAt),
      };
    });

    return {
      transactions: formattedTransactions,
      total,
      limit,
      offset,
    };
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

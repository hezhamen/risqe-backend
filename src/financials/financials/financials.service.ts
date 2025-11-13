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
import { Group } from '../../rosca/group.entity';
import { GroupMember } from '../../rosca/group-member.entity';
import {
  CreateWithdrawalRequestDto,
  ProcessTransactionDto,
  CreateDepositDto,
  PayTransactionDto,
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
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private groupMemberRepository: Repository<GroupMember>,
    private readonly httpService: HttpService,
  ) {}

  async createDeposit(
    userId: string,
    createDepositDto: CreateDepositDto,
  ): Promise<{
    id: string;
    type: string;
    amount: number;
    status: string;
    createdAt: Date;
    newBalance: number;
  }> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (createDepositDto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    // Create deposit transaction
    const depositTransaction = this.transactionRepository.create({
      userId,
      groupId: null,
      amount: createDepositDto.amount,
      type: 'DEPOSIT',
      status: 'COMPLETED',
      description: 'Balance topped up',
    });

    const savedTransaction = await this.transactionRepository.save(
      depositTransaction,
    );

    // Update user balance
    await this.userRepository.increment(
      { id: userId },
      'internalBalance',
      createDepositDto.amount,
    );

    // Get updated user balance
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    return {
      id: savedTransaction.id,
      type: savedTransaction.type,
      amount: savedTransaction.amount,
      status: savedTransaction.status,
      createdAt: savedTransaction.createdAt,
      newBalance: updatedUser?.internalBalance || 0,
    };
  }

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

  /**
   * Calculate payment amount per member for a group
   */
  private async calculatePaymentAmount(group: Group): Promise<number> {
    // Get active members count
    const memberCount = await this.groupMemberRepository.count({
      where: { groupId: group.id, status: 'ACTIVE' },
    });

    if (memberCount === 0) {
      return 0;
    }

    // Payment amount = totalFundTarget / number of members
    return Number(group.totalFundTarget) / memberCount;
  }

  /**
   * Calculate next payment due date based on group frequency
   */
  private calculateNextPaymentDue(
    groupCreatedAt: Date,
    frequency: string,
    periodNumber: number = 1,
  ): Date {
    const createdDate = new Date(groupCreatedAt);
    let daysToAdd = 0;

    switch (frequency) {
      case 'week':
        daysToAdd = 7 * periodNumber;
        break;
      case '10 days':
        daysToAdd = 10 * periodNumber;
        break;
      case '15 days':
        daysToAdd = 15 * periodNumber;
        break;
      case 'month':
        daysToAdd = 30 * periodNumber;
        break;
      default:
        daysToAdd = 30 * periodNumber; // Default to monthly
    }

    const nextDue = new Date(createdDate);
    nextDue.setDate(nextDue.getDate() + daysToAdd);
    return nextDue;
  }

  /**
   * Create payment due transactions for all active group members
   * This should be called when a payment period is due
   */
  async createPaymentDueTransactions(
    groupId: string,
    periodNumber: number = 1,
  ): Promise<GroupTransaction[]> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (!group.isActive) {
      throw new BadRequestException('Group is not active');
    }

    // Get all active members
    const activeMembers = await this.groupMemberRepository.find({
      where: { groupId, status: 'ACTIVE' },
    });

    if (activeMembers.length === 0) {
      return [];
    }

    // Calculate payment amount per member
    const paymentAmount = Number(group.totalFundTarget) / activeMembers.length;
    const nextDueDate = this.calculateNextPaymentDue(
      group.createdAt,
      group.frequency || 'month',
      periodNumber,
    );

    // Create payment due transactions for each member
    const transactions: GroupTransaction[] = [];

    for (const member of activeMembers) {
      // Check if transaction already exists for this period
      // We check by looking for PENDING transactions for this user/group
      const existingTransaction = await this.transactionRepository.findOne({
        where: {
          groupId,
          userId: member.userId,
          type: 'PAYMENT',
          status: 'PENDING',
        },
        order: { createdAt: 'DESC' },
      });

      // Only create if no pending transaction exists or if this is a new period
      if (!existingTransaction) {
        const transaction = this.transactionRepository.create({
          groupId,
          userId: member.userId,
          amount: paymentAmount,
          type: 'PAYMENT',
          status: 'PENDING',
          description: `Payment due for ${group.name} - Period ${periodNumber}`,
          dueDate: nextDueDate, // Set dueDate to when payment is actually due
        });

        const savedTransaction = await this.transactionRepository.save(
          transaction,
        );
        transactions.push(savedTransaction);
      }
    }

    return transactions;
  }

  /**
   * Get payments due for a user
   * Returns ALL PENDING GROUP_PAYMENT transactions (including future-due payments)
   * Also calculates future payments on-the-fly from group data if transactions don't exist
   * Allows users to see and pay early payments
   */
  async getPaymentsDue(userId: string): Promise<
    Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      groupId: string | null;
      groupName: string | null;
      createdAt: Date;
      dueDate: Date;
    }>
  > {
    // Get ALL pending GROUP_PAYMENT transactions, regardless of due date
    const existingTransactions = await this.transactionRepository.find({
      where: {
        userId,
        type: 'PAYMENT',
        status: 'PENDING',
      },
      relations: ['group'],
    });

    // Get all groups the user is an active member of
    const userMemberships = await this.groupMemberRepository.find({
      where: {
        userId,
        status: 'ACTIVE',
      },
      relations: ['group'],
    });

    const now = new Date();
    const calculatedPayments: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      groupId: string | null;
      groupName: string | null;
      createdAt: Date;
      dueDate: Date;
    }> = [];

    // For each group membership, calculate future payment periods
    for (const membership of userMemberships) {
      const group = membership.group;

      if (!group.isActive) {
        continue; // Skip inactive groups
      }

      // Get active members count for this group
      const activeMembers = await this.groupMemberRepository.count({
        where: { groupId: group.id, status: 'ACTIVE' },
      });

      if (activeMembers === 0) {
        continue; // Skip groups with no active members
      }

      // Calculate payment amount per member
      const paymentAmount = Number(group.totalFundTarget) / activeMembers;

      // Get existing transactions for this group to see which periods are already covered
      const groupTransactions = existingTransactions.filter(
        (t) => t.groupId === group.id,
      );

      // Calculate future payment periods (up to 12 periods ahead)
      const maxPeriods = 12;
      for (let periodNumber = 1; periodNumber <= maxPeriods; periodNumber++) {
        const dueDate = this.calculateNextPaymentDue(
          group.createdAt,
          group.frequency || 'month',
          periodNumber,
        );

        // Skip if payment is too far in the past (more than 1 period overdue)
        const onePeriodAgo = this.calculateNextPaymentDue(
          group.createdAt,
          group.frequency || 'month',
          Math.max(1, periodNumber - 1),
        );
        if (dueDate < onePeriodAgo && dueDate < now) {
          continue; // Skip very old periods
        }

        // Check if transaction already exists for this period
        // We match by checking if there's a transaction with similar dueDate (within 1 day)
        const hasExistingTransaction = groupTransactions.some((t) => {
          const tDueDate = t.dueDate || t.createdAt;
          const daysDiff = Math.abs(
            (dueDate.getTime() - tDueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          return daysDiff < 1; // Within 1 day
        });

        if (!hasExistingTransaction) {
          // Create a virtual transaction entry for this calculated payment
          calculatedPayments.push({
            id: `calculated-${group.id}-${periodNumber}`, // Virtual ID
            type: 'GROUP_PAYMENT',
            amount: paymentAmount,
            status: 'PENDING',
            groupId: group.id,
            groupName: group.name,
            createdAt: now, // When we calculated it
            dueDate: dueDate,
          });
        }
      }
    }

    // Combine existing transactions with calculated payments
    const allPayments = [
      ...existingTransactions.map((transaction) => ({
        id: transaction.id,
        type: 'GROUP_PAYMENT',
        amount: transaction.amount,
        status: transaction.status,
        groupId: transaction.groupId || null,
        groupName: transaction.group?.name || null,
        createdAt: transaction.createdAt,
        dueDate: transaction.dueDate || transaction.createdAt,
      })),
      ...calculatedPayments,
    ];

    // Sort by dueDate (earliest first)
    allPayments.sort((a, b) => {
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    return allPayments;
  }

  /**
   * Pay a transaction (mark as COMPLETED and deduct from balance)
   * Allows paying ANY pending GROUP_PAYMENT transaction, including future-due payments (early payments)
   * No date restrictions - users can pay ahead of schedule
   */
  async payTransaction(
    userId: string,
    transactionId: string,
  ): Promise<{
    success: boolean;
    message: string;
    transactionId: string;
    newBalance: number;
  }> {
    let transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['user', 'group'],
    });

    // Handle calculated payments (virtual IDs starting with "calculated-")
    if (!transaction && transactionId.startsWith('calculated-')) {
      // Parse group ID and period number from virtual ID: "calculated-{groupId}-{periodNumber}"
      const parts = transactionId.split('-');
      if (parts.length >= 3) {
        // UUID format: "calculated-{uuid}-{periodNumber}"
        // Extract UUID (first 5 parts) and period number (last part)
        const uuidParts = parts.slice(1, -1); // All parts except first and last
        const groupId = uuidParts.join('-'); // Rejoin UUID parts
        const periodNumber = parseInt(parts[parts.length - 1], 10);

        const group = await this.groupRepository.findOne({
          where: { id: groupId },
        });

        if (!group) {
          throw new NotFoundException('Group not found');
        }

        if (!group.isActive) {
          throw new BadRequestException('Group is not active');
        }

        // Verify user is a member of this group
        const membership = await this.groupMemberRepository.findOne({
          where: { groupId, userId, status: 'ACTIVE' },
        });

        if (!membership) {
          throw new BadRequestException(
            'You are not a member of this group',
          );
        }

        // Get active members count
        const activeMembers = await this.groupMemberRepository.count({
          where: { groupId, status: 'ACTIVE' },
        });

        if (activeMembers === 0) {
          throw new BadRequestException('Group has no active members');
        }

        // Calculate payment amount
        const paymentAmount = Number(group.totalFundTarget) / activeMembers;

        // Calculate due date
        const dueDate = this.calculateNextPaymentDue(
          group.createdAt,
          group.frequency || 'month',
          periodNumber,
        );

        // Create the transaction record
        transaction = this.transactionRepository.create({
          groupId,
          userId,
          amount: paymentAmount,
          type: 'PAYMENT',
          status: 'PENDING',
          description: `Payment due for ${group.name} - Period ${periodNumber}`,
          dueDate: dueDate,
        });

        await this.transactionRepository.save(transaction);

        // Reload with relations
        transaction = await this.transactionRepository.findOne({
          where: { id: transaction.id },
          relations: ['user', 'group'],
        });
      }
    }

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify transaction belongs to user
    if (transaction.userId !== userId) {
      throw new BadRequestException(
        'You are not authorized to pay this transaction',
      );
    }

    // Verify transaction is PENDING
    if (transaction.status !== 'PENDING') {
      throw new BadRequestException(
        `Transaction has already been ${transaction.status.toLowerCase()}`,
      );
    }

    // Verify transaction is a PAYMENT type
    if (transaction.type !== 'PAYMENT') {
      throw new BadRequestException('Only payment transactions can be paid');
    }

    // NOTE: No dueDate check - early payments are allowed
    // Users can pay future-due payments ahead of schedule

    // Check user balance
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.internalBalance < transaction.amount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${transaction.amount} IQD, Available: ${user.internalBalance} IQD`,
      );
    }

    // Deduct from user balance
    await this.userRepository.decrement(
      { id: userId },
      'internalBalance',
      transaction.amount,
    );

    // Update transaction status
    transaction.status = 'COMPLETED';
    await this.transactionRepository.save(transaction);

    // Update group member's total contribution
    if (transaction.groupId) {
      await this.groupMemberRepository.increment(
        { groupId: transaction.groupId, userId },
        'totalContribution',
        transaction.amount,
      );
    }

    // Get updated balance
    const updatedUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    return {
      success: true,
      message: 'Payment completed successfully',
      transactionId: transaction.id,
      newBalance: updatedUser?.internalBalance || 0,
    };
  }
}

import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Group } from '../group.entity';
import { GroupMember } from '../group-member.entity';
import { GroupTransaction } from '../../financials/group-transaction.entity';
import { User } from '../../user/user.entity';
import {
  CreateGroupDto,
  JoinGroupDto,
  VoteOnPayoutDto,
  InviteMemberDto,
} from '../dto/rosca.dto';

@Injectable()
export class RoscaService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(GroupTransaction)
    private groupTransactionRepository: Repository<GroupTransaction>,
    private dataSource: DataSource, // Injecting DataSource for transactions
  ) {}

  async createGroup(
    adminId: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    // Verify admin user exists
    const adminUser = await this.userRepository.findOne({
      where: { id: adminId },
    });
    if (!adminUser) {
      throw new BadRequestException('Admin user not found');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create the Group entity (exclude members and memberOrder from DTO)
      const { members, memberOrder, ...groupData } = createGroupDto;
      const newGroup = manager.create(Group, {
        ...groupData,
        adminUserId: adminId,
      });
      const savedGroup = await manager.save(newGroup);

      // 2. Add the administrator as the first GroupMember
      const adminMember = manager.create(GroupMember, {
        groupId: savedGroup.id,
        userId: adminId,
        is_admin: true,
        status: 'ACTIVE',
      });
      await manager.save(adminMember);

      // 3. Validate and add other members if provided
      if (members && members.length > 0) {
        // Extract unique userIds from members array
        const memberUserIds = members.map((m) => m.userId);
        const uniqueMemberUserIds = [...new Set(memberUserIds)];

        // Check for duplicate userIds in members array
        if (memberUserIds.length !== uniqueMemberUserIds.length) {
          throw new BadRequestException('Duplicate user IDs in members array');
        }

        // Check if admin is included in members (should not be)
        if (memberUserIds.includes(adminId)) {
          throw new BadRequestException(
            'Creator cannot be included in members array',
          );
        }

        // Validate that all userIds exist
        const memberUsers = await this.userRepository.find({
          where: { id: In(uniqueMemberUserIds) },
        });
        const foundUserIds = memberUsers.map((u) => u.id);
        const missingUserIds = uniqueMemberUserIds.filter(
          (id) => !foundUserIds.includes(id),
        );

        if (missingUserIds.length > 0) {
          throw new NotFoundException({
            message: 'One or more user IDs not found',
            details: missingUserIds.map((userId) => ({
              userId,
              error: 'User not found',
            })),
          });
        }

        // Validate memberOrder if provided
        if (memberOrder && memberOrder.length > 0) {
          if (createGroupDto.payoutType === 'ORDERED_LIST') {
            // Check that all memberOrder userIds are in members array
            const memberOrderSet = new Set(memberOrder);
            const membersSet = new Set(uniqueMemberUserIds);
            const invalidOrderUserIds = memberOrder.filter(
              (id) => !membersSet.has(id),
            );

            if (invalidOrderUserIds.length > 0) {
              throw new BadRequestException(
                `memberOrder contains userIds not in members array: ${invalidOrderUserIds.join(', ')}`,
              );
            }

            // Check that all members are in memberOrder
            const missingInOrder = uniqueMemberUserIds.filter(
              (id) => !memberOrderSet.has(id),
            );
            if (missingInOrder.length > 0) {
              throw new BadRequestException(
                `All members must be included in memberOrder. Missing: ${missingInOrder.join(', ')}`,
              );
            }

            // Check for duplicates in memberOrder
            if (memberOrder.length !== memberOrderSet.size) {
              throw new BadRequestException('Duplicate userIds in memberOrder');
            }
          }
        } else if (createGroupDto.payoutType === 'ORDERED_LIST') {
          throw new BadRequestException(
            'memberOrder is required for ORDERED_LIST payout type',
          );
        }

        // Add members to the group
        for (const userId of uniqueMemberUserIds) {
          const existingMember = await manager.findOne(GroupMember, {
            where: { groupId: savedGroup.id, userId },
          });

          if (!existingMember) {
            const groupMember = manager.create(GroupMember, {
              groupId: savedGroup.id,
              userId,
              is_admin: false,
              status: 'ACTIVE',
            });
            await manager.save(groupMember);
          }
        }
      }

      return savedGroup;
    });
  }

  async joinGroup(
    userId: string,
    joinGroupDto: JoinGroupDto,
  ): Promise<GroupMember> {
    const { groupId } = joinGroupDto;

    // Verify group exists
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is already a member
    const existingMembership = await this.memberRepository.findOne({
      where: { groupId, userId },
    });
    if (existingMembership) {
      throw new BadRequestException('User is already a member of this group');
    }

    // Create new membership
    const newMember = this.memberRepository.create({
      groupId,
      userId,
      is_admin: false,
      status: 'ACTIVE',
    });

    return await this.memberRepository.save(newMember);
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const memberships = await this.memberRepository.find({
      where: { userId, status: 'ACTIVE' },
      relations: ['group'],
    });

    return memberships.map((membership) => membership.group);
  }

  async getGroupMembers(groupId: string): Promise<
    Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      creditScore: number;
      photoUrl?: string | null;
      isAdmin: boolean;
      status: string;
      totalContribution: number;
      totalReceived: number;
    }>
  > {
    const members = await this.memberRepository.find({
      where: { groupId, status: 'ACTIVE' },
      relations: ['user'],
    });

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email || '',
      creditScore: member.user.creditScore,
      photoUrl: member.user.photoUrl,
      isAdmin: member.is_admin,
      status: member.status,
      totalContribution: member.totalContribution,
      totalReceived: member.totalReceived,
    }));
  }

  async getGroupDetails(
    groupId: string,
    userId: string,
  ): Promise<{
    id: string;
    name: string;
    totalFundTarget: number;
    totalPoolSize: string;
    recurringPay: string;
    duration: string;
    memberCount: number;
    isActive: boolean;
    createdAt: Date;
    members: Array<{
      id: string;
      name: string;
      email: string;
      status: string;
      isYou: boolean;
      creditScore: number;
    }>;
    currentVote?: {
      dueDate: string;
      voterNames: string[];
    } | null;
  }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: ['members', 'members.user'],
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const members = await this.memberRepository.find({
      where: { groupId, status: 'ACTIVE' },
      relations: ['user'],
    });

    const memberCount = members.length;
    const recurringPay = group.totalFundTarget / memberCount;

    const formattedMembers = members.map((member) => ({
      id: member.id,
      name: `${member.user.firstName} ${member.user.lastName}`,
      email: member.user.email || '',
      status: member.totalContribution >= recurringPay ? 'Paid' : 'Payment Due',
      isYou: member.userId === userId,
      creditScore: member.user.creditScore,
    }));

    return {
      id: group.id,
      name: group.name,
      totalFundTarget: group.totalFundTarget,
      totalPoolSize: `${group.totalFundTarget.toLocaleString()} IQD`,
      recurringPay: `${recurringPay.toLocaleString()} IQD`,
      duration: group.duration || '1 year every month',
      memberCount,
      isActive: group.isActive,
      createdAt: group.createdAt,
      members: formattedMembers,
      currentVote: null,
    };
  }

  async voteOnPayout(
    groupId: string,
    userId: string,
    voteOnPayoutDto: VoteOnPayoutDto,
  ): Promise<{
    success: boolean;
    message: string;
    voteId: string;
  }> {
    const { memberId, voteType } = voteOnPayoutDto;

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.payoutType !== 'VOTE_BASED') {
      throw new BadRequestException('This group does not support voting');
    }

    const member = await this.memberRepository.findOne({
      where: { id: memberId, groupId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return {
      success: true,
      message: 'Vote submitted successfully',
      voteId: memberId,
    };
  }

  async inviteMember(
    groupId: string,
    userId: string,
    inviteMemberDto: InviteMemberDto,
  ): Promise<{
    success: boolean;
    message: string;
    invitationId: string;
  }> {
    const { email } = inviteMemberDto;

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (user) {
      const existingMember = await this.memberRepository.findOne({
        where: { groupId, userId: user.id },
      });
      if (existingMember) {
        throw new BadRequestException('User is already a member of this group');
      }
    }

    return {
      success: true,
      message: `Invite sent to ${email}`,
      invitationId: groupId,
    };
  }

  async getGroupTransactions(
    groupId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      memberId: string;
      memberName: string;
      memberCreditScore: number;
      status: string;
      createdAt: Date;
    }>;
    total: number;
    limit: number;
    offset: number;
  }> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const [transactions, total] = await this.groupTransactionRepository.findAndCount({
      where: { groupId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const formattedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      memberId: transaction.userId,
      memberName: `${transaction.user.firstName} ${transaction.user.lastName}`,
      memberCreditScore: transaction.user.creditScore,
      status: transaction.status,
      createdAt: transaction.createdAt,
    }));

    return {
      transactions: formattedTransactions,
      total,
      limit,
      offset,
    };
  }
}

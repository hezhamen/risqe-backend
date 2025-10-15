import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Group } from '../group.entity';
import { GroupMember } from '../group-member.entity';
import { User } from '../../user/user.entity';
import { CreateGroupDto, JoinGroupDto } from '../dto/rosca.dto';

@Injectable()
export class RoscaService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private memberRepository: Repository<GroupMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource, // Injecting DataSource for transactions
  ) {}

  async createGroup(adminId: string, createGroupDto: CreateGroupDto): Promise<Group> {
    // Verify admin user exists
    const adminUser = await this.userRepository.findOne({ where: { id: adminId } });
    if (!adminUser) {
      throw new BadRequestException('Admin user not found');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create the Group entity
      const newGroup = manager.create(Group, {
        ...createGroupDto,
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

      return savedGroup;
    });
  }

  async joinGroup(userId: string, joinGroupDto: JoinGroupDto): Promise<GroupMember> {
    const { groupId } = joinGroupDto;

    // Verify group exists
    const group = await this.groupRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if user is already a member
    const existingMembership = await this.memberRepository.findOne({
      where: { groupId, userId }
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

    return memberships.map(membership => membership.group);
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return await this.memberRepository.find({
      where: { groupId, status: 'ACTIVE' },
      relations: ['user'],
    });
  }
}

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
import { RoscaService } from './rosca.service';
import {
  CreateGroupDto,
  JoinGroupDto,
  VoteOnPayoutDto,
  InviteMemberDto,
  RespondToInvitationDto,
} from '../dto/rosca.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';
import { Query } from '@nestjs/common';

@ApiTags('ROSCA')
@ApiBearerAuth('JWT-auth')
@Controller('rosca')
@UseGuards(JwtAuthGuard)
export class RoscaController {
  constructor(private readonly roscaService: RoscaService) {}

  @Post('groups')
  @ApiOperation({
    summary: 'Create a new ROSCA group',
    description:
      'Create a new ROSCA (Rotating Savings and Credit Association) group',
  })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({
    status: 201,
    description: 'ROSCA group created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        name: { type: 'string', example: 'Alpha Circle' },
        totalFundTarget: { type: 'number', example: 1000 },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGroup(
    @GetUser() user: any,
    @Body(ValidationPipe) createGroupDto: CreateGroupDto,
  ) {
    return this.roscaService.createGroup(user.id, createGroupDto);
  }

  @Post('groups/join')
  @ApiOperation({
    summary: 'Join an existing ROSCA group',
    description: 'Join an existing ROSCA group using a group code',
  })
  @ApiBody({ type: JoinGroupDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully joined the ROSCA group',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully joined the group' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid group code or already a member',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async joinGroup(
    @GetUser() user: any,
    @Body(ValidationPipe) joinGroupDto: JoinGroupDto,
  ) {
    return this.roscaService.joinGroup(user.id, joinGroupDto);
  }

  @Get('groups')
  @ApiOperation({
    summary: "Get user's ROSCA groups",
    description:
      'Retrieve all ROSCA groups that the authenticated user is a member of',
  })
  @ApiResponse({
    status: 200,
    description: "List of user's ROSCA groups",
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'Alpha Circle' },
          totalFundTarget: { type: 'number', example: 1000 },
          memberCount: { type: 'number', example: 5 },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserGroups(@GetUser() user: any) {
    return this.roscaService.getUserGroups(user.id);
  }

  @Get('groups/:id/members')
  @ApiOperation({
    summary: 'Get ROSCA group members',
    description: 'Retrieve all members of a specific ROSCA group',
  })
  @ApiParam({
    name: 'id',
    description: 'ROSCA group ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of group members',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          userId: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'Ahmed Hassan' },
          email: { type: 'string', example: 'user@example.com' },
          creditScore: { type: 'number', example: 500 },
          photoUrl: {
            type: 'string',
            example: 'https://example.com/photo.jpg',
            nullable: true,
          },
          isAdmin: { type: 'boolean', example: false },
          status: { type: 'string', example: 'ACTIVE' },
          totalContribution: { type: 'number', example: 210000 },
          totalReceived: { type: 'number', example: 0 },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupMembers(@Param('id') groupId: string) {
    return this.roscaService.getGroupMembers(groupId);
  }

  @Get('groups/:id')
  @ApiOperation({
    summary: 'Get ROSCA group details',
    description:
      'Get detailed information about a specific ROSCA group including members, transactions, voting status, and payment history.',
  })
  @ApiParam({
    name: 'id',
    description: 'ROSCA group ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Group details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'uuid-string' },
        name: { type: 'string', example: 'Peshkawtn' },
        totalFundTarget: { type: 'number', example: 840000 },
        totalPoolSize: { type: 'string', example: '840,000 IQD' },
        recurringPay: { type: 'string', example: '210,000 IQD' },
        duration: { type: 'string', example: '1 year every month' },
        memberCount: { type: 'number', example: 4 },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time' },
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-string' },
              name: { type: 'string', example: 'Bilal Aram Kareem' },
              email: { type: 'string', example: 'bilal@demo.com' },
              status: {
                type: 'string',
                enum: ['Paid', 'Payment Due'],
                example: 'Paid',
              },
              isYou: { type: 'boolean', example: false },
              creditScore: { type: 'number', example: 500 },
            },
          },
        },
        currentVote: {
          type: 'object',
          nullable: true,
          properties: {
            dueDate: { type: 'string', example: 'Due today' },
            voterNames: {
              type: 'array',
              items: { type: 'string' },
              example: ['Bilal', 'Ahmed', 'Salam'],
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupDetails(@GetUser() user: any, @Param('id') groupId: string) {
    return this.roscaService.getGroupDetails(groupId, user.id);
  }

  @Post('groups/:id/vote')
  @ApiOperation({
    summary: 'Vote on group payout',
    description:
      'Submit a vote for payout distribution in a ROSCA group. Used for vote-based payout type groups.',
  })
  @ApiParam({
    name: 'id',
    description: 'ROSCA group ID',
    example: 'uuid-string',
  })
  @ApiBody({ type: VoteOnPayoutDto })
  @ApiResponse({
    status: 200,
    description: 'Vote submitted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Vote submitted successfully' },
        voteId: { type: 'string', example: 'uuid-string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid vote or already voted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group or member not found' })
  async voteOnPayout(
    @GetUser() user: any,
    @Param('id') groupId: string,
    @Body(ValidationPipe) voteOnPayoutDto: VoteOnPayoutDto,
  ) {
    return this.roscaService.voteOnPayout(groupId, user.id, voteOnPayoutDto);
  }

  @Post('groups/:id/invite')
  @ApiOperation({
    summary: 'Invite member to group',
    description: 'Invite a member to join the ROSCA group by email. Sends an invitation email to the specified email address.',
  })
  @ApiParam({
    name: 'id',
    description: 'ROSCA group ID',
    example: 'uuid-string',
  })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({
    status: 200,
    description: 'Invitation sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Invite sent to newmember@example.com' },
        invitationId: { type: 'string', example: 'uuid-string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid email or already a member' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async inviteMember(
    @GetUser() user: any,
    @Param('id') groupId: string,
    @Body(ValidationPipe) inviteMemberDto: InviteMemberDto,
  ) {
    return this.roscaService.inviteMember(groupId, user.id, inviteMemberDto);
  }

  @Get('groups/:id/transactions')
  @ApiOperation({
    summary: 'Get group transaction history',
    description:
      'Get transaction history for a specific ROSCA group including all payments, payouts, and financial activities.',
  })
  @ApiParam({
    name: 'id',
    description: 'ROSCA group ID',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of group transactions',
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
                enum: ['PAYMENT', 'PAYOUT', 'DEPOSIT', 'WITHDRAWAL'],
                example: 'PAYMENT',
              },
              amount: { type: 'number', example: 210000 },
              memberId: { type: 'string', example: 'uuid-string' },
              memberName: { type: 'string', example: 'Bilal Aram Kareem' },
              memberCreditScore: { type: 'number', example: 500 },
              status: {
                type: 'string',
                enum: ['PENDING', 'COMPLETED', 'FAILED'],
                example: 'COMPLETED',
              },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        total: { type: 'number', example: 100 },
        limit: { type: 'number', example: 50 },
        offset: { type: 'number', example: 0 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupTransactions(
    @Param('id') groupId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.roscaService.getGroupTransactions(
      groupId,
      limit ? parseInt(limit.toString(), 10) : 50,
      offset ? parseInt(offset.toString(), 10) : 0,
    );
  }

  @Get('invitations')
  @ApiOperation({
    summary: 'Get pending group invitations',
    description:
      'Get all pending group invitations for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pending invitations',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          groupId: { type: 'string', example: 'uuid-string' },
          groupName: { type: 'string', example: 'Erbil Savings Group' },
          invitedByUserId: { type: 'string', example: 'uuid-string' },
          invitedByName: { type: 'string', example: 'John Doe' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPendingInvitations(@GetUser() user: any) {
    return this.roscaService.getPendingInvitations(user.id);
  }

  @Post('invitations/respond')
  @ApiOperation({
    summary: 'Accept or reject a group invitation',
    description:
      'Accept or reject a pending group invitation. Accepting adds the user as a group member.',
  })
  @ApiBody({ type: RespondToInvitationDto })
  @ApiResponse({
    status: 200,
    description: 'Invitation response processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Invitation accepted successfully' },
        invitationId: { type: 'string', example: 'uuid-string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid invitation or already responded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async respondToInvitation(
    @GetUser() user: any,
    @Body(ValidationPipe) respondDto: RespondToInvitationDto,
  ) {
    return this.roscaService.respondToInvitation(
      user.id,
      respondDto.invitationId,
      respondDto.action,
    );
  }
}

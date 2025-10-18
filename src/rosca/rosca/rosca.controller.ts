import { Controller, Post, Get, Body, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoscaService } from './rosca.service';
import { CreateGroupDto, JoinGroupDto } from '../dto/rosca.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('ROSCA')
@ApiBearerAuth('JWT-auth')
@Controller('rosca')
@UseGuards(JwtAuthGuard)
export class RoscaController {
  constructor(private readonly roscaService: RoscaService) {}

  @Post('groups')
  @ApiOperation({ 
    summary: 'Create a new ROSCA group',
    description: 'Create a new ROSCA (Rotating Savings and Credit Association) group'
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
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createGroup(@GetUser() user: any, @Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return this.roscaService.createGroup(user.id, createGroupDto);
  }

  @Post('groups/join')
  @ApiOperation({ 
    summary: 'Join an existing ROSCA group',
    description: 'Join an existing ROSCA group using a group code'
  })
  @ApiBody({ type: JoinGroupDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully joined the ROSCA group',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Successfully joined the group' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid group code or already a member' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async joinGroup(@GetUser() user: any, @Body(ValidationPipe) joinGroupDto: JoinGroupDto) {
    return this.roscaService.joinGroup(user.id, joinGroupDto);
  }

  @Get('groups')
  @ApiOperation({ 
    summary: 'Get user\'s ROSCA groups',
    description: 'Retrieve all ROSCA groups that the authenticated user is a member of'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user\'s ROSCA groups',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'uuid-string' },
          name: { type: 'string', example: 'Alpha Circle' },
          totalFundTarget: { type: 'number', example: 1000 },
          memberCount: { type: 'number', example: 5 },
          createdAt: { type: 'string', format: 'date-time' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserGroups(@GetUser() user: any) {
    return this.roscaService.getUserGroups(user.id);
  }

  @Get('groups/:id/members')
  @ApiOperation({ 
    summary: 'Get ROSCA group members',
    description: 'Retrieve all members of a specific ROSCA group'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'ROSCA group ID',
    example: 'uuid-string'
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
          email: { type: 'string', example: 'user@example.com' },
          joinedAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  async getGroupMembers(@Param('id') groupId: string) {
    return this.roscaService.getGroupMembers(groupId);
  }
}

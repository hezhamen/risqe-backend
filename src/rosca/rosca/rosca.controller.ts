import { Controller, Post, Get, Body, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { RoscaService } from './rosca.service';
import { CreateGroupDto, JoinGroupDto } from '../dto/rosca.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@ApiTags('rosca')
@ApiBearerAuth()
@Controller('rosca')
@UseGuards(JwtAuthGuard)
export class RoscaController {
  constructor(private readonly roscaService: RoscaService) {}

  @Post('groups')
  @ApiOperation({
    summary: 'Create a ROSCA group',
    description:
      'Creates a new ROSCA group and adds the caller as admin.\n\n' +
      'Request:\n' +
      '\`\`\`json\n{\n  "name": "Alpha Circle",\n  "totalFundTarget": 1000\n}\n\`\`\`',
  })
  @ApiCreatedResponse({ description: 'Group created', schema: { example: { id: 'uuid', name: 'Alpha Circle', totalFundTarget: 1000 } } })
  async createGroup(@GetUser() user: any, @Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return this.roscaService.createGroup(user.id, createGroupDto);
  }

  @Post('groups/join')
  async joinGroup(@GetUser() user: any, @Body(ValidationPipe) joinGroupDto: JoinGroupDto) {
    return this.roscaService.joinGroup(user.id, joinGroupDto);
  }

  @Get('groups')
  @ApiOperation({ summary: 'List groups for user', description: 'Returns groups the user belongs to.' })
  @ApiOkResponse({ description: 'List user groups', schema: { example: [{ id: 'uuid', name: 'Alpha Circle' }] } })
  async getUserGroups(@GetUser() user: any) {
    return this.roscaService.getUserGroups(user.id);
  }

  @Get('groups/:id/members')
  async getGroupMembers(@Param('id') groupId: string) {
    return this.roscaService.getGroupMembers(groupId);
  }
}

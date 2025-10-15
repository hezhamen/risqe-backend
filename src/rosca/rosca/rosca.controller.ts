import { Controller, Post, Get, Body, Param, ValidationPipe, UseGuards } from '@nestjs/common';
import { RoscaService } from './rosca.service';
import { CreateGroupDto, JoinGroupDto } from '../dto/rosca.dto';
import { JwtAuthGuard } from '../../user/auth/jwt-auth.guard';
import { GetUser } from '../../user/auth/get-user.decorator';

@Controller('rosca')
@UseGuards(JwtAuthGuard)
export class RoscaController {
  constructor(private readonly roscaService: RoscaService) {}

  @Post('groups')
  async createGroup(@GetUser() user: any, @Body(ValidationPipe) createGroupDto: CreateGroupDto) {
    return this.roscaService.createGroup(user.id, createGroupDto);
  }

  @Post('groups/join')
  async joinGroup(@GetUser() user: any, @Body(ValidationPipe) joinGroupDto: JoinGroupDto) {
    return this.roscaService.joinGroup(user.id, joinGroupDto);
  }

  @Get('groups')
  async getUserGroups(@GetUser() user: any) {
    return this.roscaService.getUserGroups(user.id);
  }

  @Get('groups/:id/members')
  async getGroupMembers(@Param('id') groupId: string) {
    return this.roscaService.getGroupMembers(groupId);
  }
}

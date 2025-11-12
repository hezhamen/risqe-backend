import { Controller, Get, Delete, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the API is running and get basic information',
  })
  @ApiResponse({
    status: 200,
    description: 'API is running',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Risqe Backend API' },
        version: { type: 'string', example: '1.0.0' },
        status: { type: 'string', example: 'running' },
      },
    },
  })
  getHello() {
    return this.appService.getHello();
  }

  @Delete('admin/wipe-database')
  @ApiOperation({
    summary: 'Wipe entire database (Development/Admin only)',
    description:
      'Delete all data from all tables. Only works in development mode or when ALLOW_DB_WIPE=true is set.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database wiped successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Database wiped successfully' },
        tablesCleared: {
          type: 'array',
          items: { type: 'string' },
          example: ['users', 'group', 'group_member', 'post', 'comment', 'group_transaction', 'withdrawal_request'],
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only allowed in development mode',
  })
  async wipeDatabase() {
    return this.appService.wipeDatabase();
  }

  @Post('admin/seed-users')
  @ApiOperation({
    summary: 'Seed 10 Kurdish users (Admin only)',
    description:
      'Create 10 random Kurdish user accounts with randomized data. User data including passwords will be saved to seeded-users.yaml file.',
  })
  @ApiResponse({
    status: 201,
    description: 'Users seeded successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Users seeded successfully' },
        usersCreated: { type: 'number', example: 10 },
        yamlFile: { type: 'string', example: '/path/to/seeded-users.yaml' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only allowed in development mode',
  })
  async seedUsers() {
    return this.appService.seedUsers();
  }

  @Get('admin/users')
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve a list of all users in the system with their profile information.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    schema: {
      type: 'object',
      properties: {
        users: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-string' },
              firstName: { type: 'string', example: 'Aram' },
              lastName: { type: 'string', example: 'Hassan' },
              email: {
                type: 'string',
                example: 'aram.hassan@example.com',
                nullable: true,
              },
              phoneNumber: { type: 'string', example: '+9647501234567' },
              internalBalance: { type: 'number', example: 500000 },
              pointsBalance: { type: 'number', example: 5000 },
              creditScore: { type: 'number', example: 650 },
              isPhoneVerified: { type: 'boolean', example: true },
              photoUrl: {
                type: 'string',
                example: 'https://example.com/photo.jpg',
                nullable: true,
              },
            },
          },
        },
        total: { type: 'number', example: 10 },
      },
    },
  })
  async getAllUsers() {
    return this.appService.getAllUsers();
  }
}

import { Controller, Get, Delete } from '@nestjs/common';
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
}

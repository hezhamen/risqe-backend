import { Controller, Get } from '@nestjs/common';
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
}

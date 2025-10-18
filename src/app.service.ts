import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string; version: string; status: string } {
    const packageJson = require('../package.json');
    return {
      message: 'Risqe Backend API',
      version: packageJson.version,
      status: 'running'
    };
  }
}

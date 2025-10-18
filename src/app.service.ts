import { Injectable } from '@nestjs/common';
import * as packageJson from '../package.json';

@Injectable()
export class AppService {
  getHello(): { message: string; version: string; status: string } {
    return {
      message: 'Risqe Backend API',
      version: packageJson.version,
      status: 'running'
    };
  }
}

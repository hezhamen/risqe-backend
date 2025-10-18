import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): { message: string; version: string; status: string } {
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      version: string;
    };
    return {
      message: 'Risqe Backend API',
      version: packageJson.version,
      status: 'running',
    };
  }
}

import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  getHello(): { message: string; version: string; status: string } {
    // Try different paths for package.json depending on environment
    const possiblePaths = [
      join(__dirname, '..', '..', 'package.json'), // Local development
      '/app/package.json', // Heroku production
      './package.json', // Fallback
    ];
    
    let packageJson: { version: string } = { version: '0.0.8' }; // Default fallback
    
    for (const path of possiblePaths) {
      try {
        packageJson = JSON.parse(readFileSync(path, 'utf8')) as { version: string };
        break;
      } catch (error) {
        // Continue to next path
      }
    }
    
    return {
      message: 'Risqe Backend API',
      version: packageJson.version,
      status: 'running',
    };
  }
}

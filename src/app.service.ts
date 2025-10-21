import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

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

  async wipeDatabase(): Promise<{ message: string; tablesCleared: string[] }> {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const allowWipe = process.env.ALLOW_DB_WIPE === 'true';
    if (!isDevelopment && !allowWipe) {
      throw new ForbiddenException('Database wipe is only allowed in development mode or when ALLOW_DB_WIPE is set to true');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const tablesCleared: string[] = [];
    try {
      await queryRunner.startTransaction();
      const tables = [
        'withdrawal_request',
        'group_transaction',
        'comment',
        'post',
        'group_member',
        'group',
        'users',
      ];
      for (const table of tables) {
        await queryRunner.query(`DELETE FROM "${table}"`);
        tablesCleared.push(table);
      }
      await queryRunner.commitTransaction();
      return {
        message: 'Database wiped successfully',
        tablesCleared,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

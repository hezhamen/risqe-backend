import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import * as yaml from 'js-yaml';
import { User } from './user/user.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
        // Check if table exists before trying to delete from it
        const tableExists = await queryRunner.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [table]);
        
        if (tableExists[0].exists) {
          await queryRunner.query(`DELETE FROM "${table}"`);
          tablesCleared.push(table);
        }
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

  async seedUsers(): Promise<{
    message: string;
    usersCreated: number;
    yamlFile: string;
  }> {
    const kurdishFirstNames = [
      'Aram',
      'Baran',
      'Dilan',
      'Diyar',
      'Haval',
      'Hemin',
      'Kawa',
      'Miran',
      'Nazdar',
      'Rojan',
      'Soran',
      'Zana',
      'Avin',
      'Baran',
      'Dilan',
      'Diyar',
      'Haval',
      'Hemin',
      'Kawa',
      'Miran',
    ];

    const kurdishLastNames = [
      'Ahmed',
      'Hassan',
      'Khalil',
      'Mahmoud',
      'Omar',
      'Rashid',
      'Salih',
      'Taha',
      'Yasin',
      'Zakaria',
      'Abdullah',
      'Bakr',
      'Dawud',
      'Faris',
      'Ghazi',
      'Hakim',
      'Ibrahim',
      'Jamil',
      'Karim',
      'Latif',
    ];

    const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];

    const generateRandomPhoneNumber = (existingNumbers: Set<string>): string => {
      const prefixes = ['750', '751', '752', '770', '771', '772', '773', '774', '775'];
      let phoneNumber: string;
      let attempts = 0;
      do {
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(1000000 + Math.random() * 9000000);
        phoneNumber = `+964${prefix}${number}`;
        attempts++;
        if (attempts > 100) {
          phoneNumber = `+964${prefix}${Date.now().toString().slice(-7)}`;
          break;
        }
      } while (existingNumbers.has(phoneNumber));
      existingNumbers.add(phoneNumber);
      return phoneNumber;
    };

    const generateRandomEmail = (firstName: string, lastName: string): string => {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomNum}@${domain}`;
    };

    const generateRandomPassword = (): string => {
      const length = 8 + Math.floor(Math.random() * 5);
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const usersData: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      password: string;
      internalBalance: number;
      pointsBalance: number;
      creditScore: number;
    }> = [];

    const createdUsers: User[] = [];
    const existingPhoneNumbers = new Set<string>();

    for (let i = 0; i < 10; i++) {
      const firstName = kurdishFirstNames[Math.floor(Math.random() * kurdishFirstNames.length)];
      const lastName = kurdishLastNames[Math.floor(Math.random() * kurdishLastNames.length)];
      const phoneNumber = generateRandomPhoneNumber(existingPhoneNumbers);
      const email = generateRandomEmail(firstName, lastName);
      const password = generateRandomPassword();
      const passwordHash = await bcrypt.hash(password, 10);
      const internalBalance = Math.floor(Math.random() * 1000000) + 100000;
      const pointsBalance = Math.floor(Math.random() * 10000) + 1000;
      const creditScore = Math.floor(Math.random() * 300) + 500;

      const user = this.userRepository.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        passwordHash,
        internalBalance,
        pointsBalance,
        creditScore,
        isPhoneVerified: Math.random() > 0.3,
      });

      const savedUser = await this.userRepository.save(user);
      createdUsers.push(savedUser);

      usersData.push({
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email || email,
        phoneNumber: savedUser.phoneNumber,
        password,
        internalBalance: savedUser.internalBalance,
        pointsBalance: savedUser.pointsBalance,
        creditScore: savedUser.creditScore,
      });
    }

    const yamlContent = {
      users: usersData,
      generatedAt: new Date().toISOString(),
      totalUsers: usersData.length,
    };

    const yamlFilePath = join(process.cwd(), 'seeded-users.yaml');
    writeFileSync(yamlFilePath, yaml.dump(yamlContent, { indent: 2 }), 'utf8');

    return {
      message: 'Users seeded successfully',
      usersCreated: createdUsers.length,
      yamlFile: yamlFilePath,
    };
  }
}

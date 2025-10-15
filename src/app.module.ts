import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UserModule } from './user/user.module';
import { RoscaModule } from './rosca/rosca.module';
import { FinancialsModule } from './financials/financials.module';
import { CommunityModule } from './community/community.module';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Load configuration and connect to database
    TypeOrmModule.forRoot(databaseConfig),
    UserModule,
    RoscaModule,
    FinancialsModule,
    CommunityModule,
    // Future feature modules will be listed here...
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { RoscaModule } from './rosca/rosca.module';
import { FinancialsModule } from './financials/financials.module';
import { CommunityModule } from './community/community.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RedeemModule } from './redeem/redeem.module';

@Module({
  imports: [
    // Load environment variables from .env file
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Load configuration and connect to database
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([User]),
    UserModule,
    RoscaModule,
    FinancialsModule,
    CommunityModule,
    NotificationsModule,
    RedeemModule,
    // Future feature modules will be listed here...
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

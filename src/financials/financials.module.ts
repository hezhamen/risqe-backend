import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GroupTransaction } from './group-transaction.entity';
import { WithdrawalRequest } from './withdrawal-request.entity';
import { User } from '../user/user.entity';
import { Group } from '../rosca/group.entity';
import { GroupMember } from '../rosca/group-member.entity';
import { UserModule } from '../user/user.module';
import { FinancialsService } from './financials/financials.service';
import { FinancialsController } from './financials/financials.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([GroupTransaction, WithdrawalRequest, User, Group, GroupMember]),
    HttpModule,
    UserModule,
  ],
  providers: [FinancialsService],
  controllers: [FinancialsController],
  exports: [FinancialsService],
})
export class FinancialsModule {}

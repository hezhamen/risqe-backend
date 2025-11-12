import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './group.entity';
import { GroupMember } from './group-member.entity';
import { GroupTransaction } from '../financials/group-transaction.entity';
import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { RoscaService } from './rosca/rosca.service';
import { RoscaController } from './rosca/rosca.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, User, GroupTransaction]),
    UserModule,
  ],
  providers: [RoscaService],
  controllers: [RoscaController],
  exports: [RoscaService],
})
export class RoscaModule {}

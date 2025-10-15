import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { CommunityService } from './community/community.service';
import { CommunityController } from './community/community.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, User]),
    UserModule,
  ],
  providers: [CommunityService],
  controllers: [CommunityController],
  exports: [CommunityService],
})
export class CommunityModule {}

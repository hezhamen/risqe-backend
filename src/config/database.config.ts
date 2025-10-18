import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Group } from '../rosca/group.entity';
import { GroupMember } from '../rosca/group-member.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { GroupTransaction } from '../financials/group-transaction.entity';
import { WithdrawalRequest } from '../financials/withdrawal-request.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL, // Heroku provides this automatically
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'risqe_db',
  entities: [
    User,
    Group,
    GroupMember,
    Post,
    Comment,
    GroupTransaction,
    WithdrawalRequest,
  ],
  synchronize: true, // Enable for initial deployment - should use migrations in production
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

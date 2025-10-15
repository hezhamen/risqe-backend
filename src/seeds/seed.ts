import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../user/user.entity';
import { Group } from '../rosca/group.entity';
import { GroupMember } from '../rosca/group-member.entity';
import { Post } from '../community/post.entity';
import { Comment } from '../community/comment.entity';
import { GroupTransaction } from '../financials/group-transaction.entity';
import { WithdrawalRequest } from '../financials/withdrawal-request.entity';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  const groupRepo = dataSource.getRepository(Group);
  const memberRepo = dataSource.getRepository(GroupMember);
  const postRepo = dataSource.getRepository(Post);
  const commentRepo = dataSource.getRepository(Comment);
  const txRepo = dataSource.getRepository(GroupTransaction);
  const withdrawalRepo = dataSource.getRepository(WithdrawalRequest);

  // Create admin user if missing
  const adminEmail = 'admin@example.com';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const passwordHash = await bcrypt.hash('secret123', 10);
    admin = await userRepo.save(
      userRepo.create({ email: adminEmail, passwordHash }),
    );
  }

  // Create sample group
  let group = await groupRepo.findOne({ where: { name: 'Alpha Circle' } });
  if (!group) {
    group = await groupRepo.save(
      groupRepo.create({ name: 'Alpha Circle', totalFundTarget: 1000, adminUserId: admin.id }),
    );
    await memberRepo.save(
      memberRepo.create({ groupId: group.id, userId: admin.id, is_admin: true, status: 'ACTIVE' }),
    );
  }

  // Create sample post & comment
  const post = await postRepo.save(
    postRepo.create({ userId: admin.id, title: 'Welcome', content: 'Hello Risqe!' }),
  );
  await commentRepo.save(
    commentRepo.create({ postId: post.id, userId: admin.id, content: 'First comment' }),
  );

  // Seed a pending withdrawal request
  await withdrawalRepo.save(
    withdrawalRepo.create({ userId: admin.id, amount: 25, paymentMethod: 'BANK_TRANSFER', paymentDetails: JSON.stringify({ iban: 'DE89 3704 0044 0532 0130 00' }) }),
  );

  // Seed a contribution transaction
  await txRepo.save(
    txRepo.create({ userId: admin.id, groupId: group.id, amount: 50, type: 'CONTRIBUTION', status: 'COMPLETED' }),
  );

  await app.close();
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});



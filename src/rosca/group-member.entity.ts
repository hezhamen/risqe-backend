import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from '../user/user.entity';

@Entity('group_members')
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  groupId: string;

  @Column()
  userId: string;

  @Column({ default: false })
  is_admin: boolean;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalContribution: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  totalReceived: number;

  // Relationships
  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

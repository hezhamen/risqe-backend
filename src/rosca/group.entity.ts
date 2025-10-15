import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GroupMember } from './group-member.entity';

@Entity('rosca_groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  adminUserId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalFundTarget: number;

  @Column({ default: 1 })
  currentPeriod: number;

  // Relationships
  @OneToMany(() => GroupMember, member => member.group)
  members: GroupMember[];
}

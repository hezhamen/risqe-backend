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

  @Column({ type: 'varchar', nullable: true })
  duration?: string | null;

  @Column({ type: 'varchar', nullable: true })
  frequency?: string | null;

  @Column({ type: 'varchar', default: 'ORDERED_LIST' })
  payoutType: 'ORDERED_LIST' | 'VOTE_BASED';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // Relationships
  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];
}

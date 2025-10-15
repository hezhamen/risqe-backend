import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GroupMember } from '../rosca/group-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string; // Stored securely after hashing

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  internalBalance: number; // The internal wallet balance

  @Column({ default: 0 })
  pointsBalance: number;

  @Column({ default: 500 })
  creditScore: number;

  // Relationships (e.g., membership in ROSCA groups)
  @OneToMany(() => GroupMember, member => member.user)
  groupMemberships: GroupMember[];
}

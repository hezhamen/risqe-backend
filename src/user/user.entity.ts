import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { GroupMember } from '../rosca/group-member.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', unique: true })
  phoneNumber: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column()
  passwordHash: string; // Stored securely after hashing

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.0 })
  internalBalance: number; // The internal wallet balance

  @Column({ default: 0 })
  pointsBalance: number;

  @Column({ default: 500 })
  creditScore: number;

  @Column({ type: 'boolean', default: false })
  isPhoneVerified: boolean;

  @Column({ type: 'varchar', nullable: true })
  phoneOtpCode?: string | null;

  @Column({ type: 'timestamp', nullable: true })
  phoneOtpExpiresAt?: Date | null;

  @Column({ type: 'varchar', nullable: true })
  namabarVerificationId?: string | null;

  // Relationships (e.g., membership in ROSCA groups)
  @OneToMany(() => GroupMember, (member) => member.user)
  groupMemberships: GroupMember[];
}

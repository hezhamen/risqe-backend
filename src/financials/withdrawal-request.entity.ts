import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('withdrawal_requests')
export class WithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  paymentMethod: string; // 'BANK_TRANSFER', 'MOBILE_MONEY', etc.

  @Column()
  paymentDetails: string; // JSON string with payment details

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  externalTransactionId: string | null;

  @Column({ type: 'varchar', nullable: true })
  failureReason: string | null;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}

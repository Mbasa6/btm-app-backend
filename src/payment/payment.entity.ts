import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Job } from '../entities/job.entity';
import { PaymentStatus } from '../payment/payment-status.enum';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Job, (job) => job.payment, { onDelete: 'CASCADE' })
  job: Job;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  providerRef: string;

  @CreateDateColumn()
  createdAt: Date;
}

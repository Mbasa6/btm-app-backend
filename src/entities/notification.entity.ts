import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export type NotificationType =
  | 'job_assigned'
  | 'payout_approved'
  | 'payout_paid'
  | 'general';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @Index()
  user: User;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 500 })
  body: string;

  @Column({ type: 'enum', enum: ['job_assigned', 'payout_approved', 'payout_paid', 'general'], default: 'general' })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  data?: Record<string, any> | null;

  @CreateDateColumn()
  createdAt: Date;
}


import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Job } from './job.entity';
import { ApprovalStatus } from '../user/approval-status.enum';

export type UserRole = 'client' | 'technician' | 'admin';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: ['client', 'technician', 'admin'],
    default: 'client',
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude?: number;

  @Column({ nullable: true, type: 'varchar', length: 120 })
  lastSavedAreaLocation?: string;

  @Column({ default: false })
  isAvailable: boolean;

  @Column({ default: false })
  isActive: boolean;

  // 🔗 CLIENT JOBS
  @OneToMany(() => Job, (job) => job.client)
  clientJobs: Job[];

  // 🔗 TECHNICIAN JOBS
  @OneToMany(() => Job, (job) => job.technician)
  technicianJobs: Job[];

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  approvalStatus: ApprovalStatus;

  @Column({ nullable: true })
  phoneNumber?: string;

  // ── PUSH NOTIFICATIONS ────────────────────────────────────────────────────
  @Column({ nullable: true, type: 'varchar', length: 500 })
  expoPushToken?: string;

  // ── BANK DETAILS (for technician payout) ─────────────────────────────────
  @Column({ nullable: true, type: 'varchar', length: 255 })
  bankName?: string;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  bankAccountNumber?: string;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  bankAccountHolder?: string;
}
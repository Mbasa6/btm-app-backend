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

  @Column({ nullable: true })
  latitude?: number;

  @Column({ nullable: true })
  longitude?: number;

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

}

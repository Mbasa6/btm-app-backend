import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { JobStatus } from '../job/job-status.enum';
import { Payment } from '../payment/payment.entity';
import { ServiceItem } from './service-item.entity';

@Entity()
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @ManyToOne(() => User, (user) => user.clientJobs, { eager: false })
  client: User;

  @ManyToOne(() => User, (user) => user.technicianJobs, {
    nullable: true,
    eager: false,
  })
  technician: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToMany(() => User)
  @JoinTable()
  declinedBy: User[];

  @OneToOne(() => Payment, (payment) => payment.job, { nullable: true })
  @JoinColumn()
  payment: Payment;

  @ManyToOne(() => ServiceItem, { nullable: true, eager: true, onDelete: 'SET NULL' })
  serviceItem: ServiceItem | null;

  // ─── CLIENT LOCATION (optional — kept for proximity filtering) ────────────
  // No longer required from the client. If present, used by getAssignedJobs
  // to filter technicians by radius. address field is the primary input now.
  @Column({ type: 'float', nullable: true })
  clientLatitude: number | null;

  @Column({ type: 'float', nullable: true })
  clientLongitude: number | null;

  // ─── ADDRESS (plain text typed by client — no GPS needed) ─────────────────
  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  // ─── BEFORE / AFTER IMAGES ────────────────────────────────────────────────
  // Arrays of server file paths e.g. ["/uploads/jobs/before/1234.jpg"]
  @Column({ type: 'json', nullable: true })
  beforeImages: string[];

  @Column({ type: 'json', nullable: true })
  afterImages: string[];

  // ─── RATING & FEEDBACK (submitted by client after job completion) ──────────
  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;
}
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

  // ─── CLIENT LOCATION ──────────────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  clientLatitude: number | null;

  @Column({ type: 'float', nullable: true })
  clientLongitude: number | null;

  // ─── ADDRESS ──────────────────────────────────────────────────────────────
  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  // ─── MANUAL CLIENT DETAILS (admin-created WhatsApp/off-app bookings) ─────
  @Column({ type: 'varchar', length: 120, nullable: true })
  manualClientName: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  manualClientSurname: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  manualClientEmail: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  manualClientPhone: string | null;

  // ─── IMAGES ───────────────────────────────────────────────────────────────
  @Column({ type: 'json', nullable: true })
  clientImages: string[];

  @Column({ type: 'json', nullable: true })
  beforeImages: string[];

  @Column({ type: 'json', nullable: true })
  afterImages: string[];

  // ─── RATING & FEEDBACK ────────────────────────────────────────────────────
  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;

  // ─── PAYOUT MODEL ─────────────────────────────────────────────────────────
  @Column({ type: 'float', nullable: true })
  clientPrice: number | null;

  @Column({ type: 'float', nullable: true })
  technicianPercentage: number | null;

  @Column({ type: 'float', nullable: true })
  technicianPayout: number | null;

  @Column({ type: 'boolean', default: false })
  payoutLocked: boolean;

  @Column({
    type: 'enum',
    enum: ['none', 'requested', 'approved', 'paid'],
    default: 'none',
  })
  payoutStatus: 'none' | 'requested' | 'approved' | 'paid';

  @Column({ type: 'timestamp', nullable: true })
  dispatchedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  acceptedAt: Date | null;
}


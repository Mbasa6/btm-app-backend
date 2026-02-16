import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, CreateDateColumn, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { JobStatus } from '../job/job-status.enum';
import { Payment } from '../payment/payment.entity'
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


}

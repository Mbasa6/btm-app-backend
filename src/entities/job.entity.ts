import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { JobStatus } from '../job/job-status.enum';

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
}

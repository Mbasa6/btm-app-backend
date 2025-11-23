import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export type JobStatus = | 'unassigned' | 'assigned' | 'accepted' | 'declined' | 'in-progress' | 'completed';


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
    enum: ['unassigned', 'assigned', 'accepted', 'declined', 'in-progress', 'completed'],
    default: 'unassigned',
  })
  status: JobStatus;

  @ManyToOne(() => User, (user) => user.id)
  client: User;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  technician: User | null;

  @CreateDateColumn()
  createdAt: Date;
}

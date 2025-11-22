import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export type JobStatus = 'pending' | 'accepted' | 'completed';

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
    enum: ['pending', 'accepted', 'completed'],
    default: 'pending',
  })
  status: JobStatus;

  @ManyToOne(() => User, (user) => user.id)
  client: User;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  technician: User;

  @CreateDateColumn()
  createdAt: Date;
}

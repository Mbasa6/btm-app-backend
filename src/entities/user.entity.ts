import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

  @Column({ default: true })
  isAvailable: boolean;

}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ServiceItem } from './service-item.entity';

@Entity()
export class ServiceCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Example: "Installation", "Repair", "Splicing"
  @Column({ nullable: true })
  description: string;

  @OneToMany(() => ServiceItem, (item) => item.category)
  items: ServiceItem[];
}

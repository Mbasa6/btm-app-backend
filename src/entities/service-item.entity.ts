import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ServiceCategory } from './service-category.entity';

@Entity()
export class ServiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Example: "New fibre installation"
  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => ServiceCategory, (category) => category.items, {
    onDelete: 'CASCADE',
  })
  category: ServiceCategory;
}

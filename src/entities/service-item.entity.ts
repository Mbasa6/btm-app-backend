import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { ServiceCategory } from "./service-category.entity";
@Entity()
export class ServiceItem {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ nullable: true })
  description: string;
  @ManyToOne(() => ServiceCategory, (category) => category.items, { onDelete: "CASCADE" })
  category: ServiceCategory;
  // 0.35 = 35% standard, 0.40 = 40% complex
  @Column({ type: "float", default: 0.35 })
  technicianPercentage: number;
}

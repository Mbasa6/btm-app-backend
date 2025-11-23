import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { ServiceItem } from '../entities/service-item.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private categoriesRepo: Repository<ServiceCategory>,

    @InjectRepository(ServiceItem)
    private itemsRepo: Repository<ServiceItem>,
  ) {}

  // Admin: create category
  createCategory(name: string, description?: string) {
    const cat = this.categoriesRepo.create({ name, description });
    return this.categoriesRepo.save(cat);
  }

  // Admin: create service item in category
  createItem(categoryId: number, name: string, description?: string) {
    const item = this.itemsRepo.create({
      name,
      description,
      category: { id: categoryId },
    });
    return this.itemsRepo.save(item);
  }

  // Client: get all categories with their items
  getAllCategories() {
    return this.categoriesRepo.find({
      relations: ['items'],
      order: {
        id: 'ASC',
        items: { id: 'ASC' },
      },
    });
  }

  // Client: get items in a category
  getItemsByCategory(categoryId: number) {
    return this.itemsRepo.find({
      where: { category: { id: categoryId } },
      order: { id: 'ASC' },
    });
  }
}

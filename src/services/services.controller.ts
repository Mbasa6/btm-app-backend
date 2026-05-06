import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('service-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  // Client: Get all categories + items
  @Get()
  getAllCategories() {
    return this.servicesService.getAllCategories();
  }

  // Client: Get only items for category
  @Get(':id/items')
  getItemsByCategory(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.getItemsByCategory(id);
  }

  // Admin: create category
  @Post()
  @Roles('admin')
  createCategory(@Body() body: { name: string; description?: string }) {
    return this.servicesService.createCategory(body.name, body.description);
  }

  // Admin: create item under a category
  @Post(':id/items')
  @Roles('admin')
  createItem(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() body: { name: string; description?: string },
  ) {
    return this.servicesService.createItem(categoryId, body.name, body.description);
  }
}

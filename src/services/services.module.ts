import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { ServiceItem } from '../entities/service-item.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategory, ServiceItem])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

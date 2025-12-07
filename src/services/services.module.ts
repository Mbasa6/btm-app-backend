import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { ServiceItem } from '../entities/service-item.entity';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { UserController } from '../user/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceCategory, ServiceItem, User])],
  controllers: [ServicesController,UserController,],
  providers: [ServicesService, UserService],
  exports: [ServicesService, UserService],
})
export class ServicesModule {}

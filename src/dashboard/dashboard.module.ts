import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Job } from '../entities/job.entity';
import { Payment } from '../payment/payment.entity';
import { ServiceItem } from '../entities/service-item.entity';
import { ServiceCategory } from '../entities/service-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Job,
      Payment,
      ServiceItem,
      ServiceCategory,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

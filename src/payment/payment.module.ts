import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Job } from '../entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Job])],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}

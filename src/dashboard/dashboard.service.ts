import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { Payment } from '../payment/payment.entity';
import { ServiceItem } from '../entities/service-item.entity';
import { ServiceCategory } from '../entities/service-category.entity';
import { JobStatus } from '../job/job-status.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Job)
    private jobRepo: Repository<Job>,

    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,

    @InjectRepository(ServiceItem)
    private serviceItemRepo: Repository<ServiceItem>,

    @InjectRepository(ServiceCategory)
    private serviceCategoryRepo: Repository<ServiceCategory>,
  ) {}

  async getOverview() {
    const totalJobs = await this.jobRepo.count();

    const completedJobs = await this.jobRepo.count({
      where: { status: JobStatus.COMPLETED }
    });

    const pendingJobs = await this.jobRepo.count({
      where: { status: JobStatus.COMPLETED }
    });

    const revenueResult = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'PAID' })
      .getRawOne();

    const totalRevenue = Number(revenueResult.total) || 0;

    const rawStatusBreakdown = await this.jobRepo
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(job.id)', 'count')
      .groupBy('job.status')
      .getRawMany();

    const statusBreakdown = rawStatusBreakdown.map(item => ({
      status: item.status,
      count: Number(item.count),
    }));

    const rawRevenueByCategory = await this.paymentRepo
      .createQueryBuilder('payment')
      .innerJoin('payment.job', 'job')
      .innerJoin('job.serviceItem', 'serviceItem')
      .innerJoin('serviceItem.category', 'category')
      .select('category.name', 'category')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: 'PAID' })
      .groupBy('category.name')
      .getRawMany();

    const revenueByCategory = rawRevenueByCategory.map(item => ({
      category: item.category,
      total: Number(item.total),
    }));

    const paymentsDebug = await this.paymentRepo.find({
      relations: ['job'],
    });

    console.log(paymentsDebug);

    const jobsDebug = await this.jobRepo.find({
      relations: ['serviceItem'],
    });

    console.log(jobsDebug);

      return {
        totalJobs,
        completedJobs,
        pendingJobs,
        totalRevenue,
        statusBreakdown,
        revenueByCategory
      };

  }

}

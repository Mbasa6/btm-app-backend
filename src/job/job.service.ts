import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { User } from '../entities/user.entity';
import { JobStatus } from '../job/job-status.enum';
import { CreateJobDto } from '../dto/create-job.dto';
import { PaymentStatus } from '../payment/payment-status.enum';
import { ServiceItem } from '../entities/service-item.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobsRepo: Repository<Job>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ServiceItem)
    private serviceItemRepo: Repository<ServiceItem>,
  ) {}

  async createJob(client: User, dto: CreateJobDto) {
    const serviceItem = await this.serviceItemRepo.findOne({ where: { id: dto.serviceItemId } });
    if (!serviceItem) {
      throw new NotFoundException('Service item not found');
    }

    const job = this.jobsRepo.create({
      ...dto,
      client,
      status: JobStatus.PENDING,
      serviceItem,  // now properly linked
    });

    return this.jobsRepo.save(job);
  }


  notifyTechnician(tech: User, job: Job) {
    console.log(`Notify ${tech.fullName} about job ${job.id}`);
  }

  /** TECHNICIAN ACCEPT JOB */
  async acceptJob(technician: User, jobId: number) {
    const freshTech = await this.userRepo.findOne({
      where: { id: technician.id },
    });

    if (!freshTech || !freshTech.isAvailable) {
      throw new ForbiddenException('Technician not available');
    }

    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician', 'payment'],
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.PENDING) {
      throw new ForbiddenException('Job not available');
    }

    // 🔐 PAYMENT GATE
    if (!job.payment || job.payment.status !== PaymentStatus.PAID) {
      throw new ForbiddenException('Job not dispatchable');
    }

    job.technician = freshTech;
    job.status = JobStatus.ACCEPTED;

    return this.jobsRepo.save(job);
  }




  /** TECHNICIAN DECLINE JOB */
  async declineJob(technician: User, jobId: number) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician', 'declinedBy'],
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.PENDING)
      throw new ForbiddenException('Cannot decline');

    // Add this technician to the declined list
    if (!job.declinedBy) job.declinedBy = [];
    job.declinedBy.push(technician);

    // Remove technician assignment if needed
    if (job.technician?.id === technician.id) {
      job.technician = null;
    }

    return this.jobsRepo.save(job);
  }



  /** GET JOBS FOR USER */
  async getMyJobs(user: User) {
    if (user.role === 'client') {
      return this.jobsRepo.find({ where: { client: { id: user.id } }, relations: ['technician', 'client', 'payment'] });
    } else if (user.role === 'technician') {
      return this.jobsRepo.find({ where: { technician: { id: user.id } }, relations: ['technician', 'client'] });
    }
    return [];
  }

  /** GET PENDING/ASSIGNED JOBS FOR TECH */
  async getAssignedJobs(technician: User) {
    return this.jobsRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.payment', 'payment')
      .leftJoinAndSelect('job.declinedBy', 'declinedBy')
      .where('job.status = :status', { status: JobStatus.PENDING })
      .andWhere('payment.status = :paid', { paid: PaymentStatus.PAID })
      .andWhere(
        ':techId NOT IN (SELECT userId FROM job_declined_by_user WHERE jobId = job.id)',
        { techId: technician.id },
      )
      .getMany();
  }

  /** ADMIN: GET ALL JOBS */
    async getAllJobs() {
      return this.jobsRepo.find({
        relations: ['client', 'technician'],
        order: { id: 'DESC' }
      });
    }
  private readonly validTransitions = {
    [JobStatus.PENDING]: [JobStatus.ACCEPTED],
    [JobStatus.ACCEPTED]: [JobStatus.IN_PROGRESS],
    [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
    [JobStatus.COMPLETED]: [JobStatus.CLOSED],
  };

  async updateJobStatus(jobId: number, newStatus: JobStatus) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    const allowed = this.validTransitions[job.status];
    if (!allowed?.includes(newStatus)) {
      throw new ForbiddenException('Invalid job status transition');
    }

    job.status = newStatus;
    return this.jobsRepo.save(job);
  }

  async assignTechnician(jobId: number, technicianId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId }, relations: ['technician', 'client'] });
    if (!job) throw new NotFoundException('Job not found');

    const tech = await this.userRepo.findOne({ where: { id: technicianId, role: 'technician', isActive: true } });
    if (!tech) throw new NotFoundException('Technician not found or inactive');

    job.technician = tech;
    // If job was previously unassigned or declined, mark as assigned
    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.ACCEPTED;
    }

    return this.jobsRepo.save(job);
  }

  async forceCloseJob(jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    job.status = JobStatus.CLOSED;
    return this.jobsRepo.save(job);
  }

  async filterJobs(filters: { status?: JobStatus; technicianId?: number; clientId?: number }) {
    const query = this.jobsRepo.createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.technician', 'technician');

    if (filters.status) query.andWhere('job.status = :status', { status: filters.status });
    if (filters.technicianId) query.andWhere('technician.id = :techId', { techId: filters.technicianId });
    if (filters.clientId) query.andWhere('client.id = :clientId', { clientId: filters.clientId });

    return query.orderBy('job.id', 'DESC').getMany();
  }

  async getJobById(jobId: number) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['client', 'technician', 'payment'],
    });

    console.log('DEBUG: job fetched:', job);
    console.log('DEBUG: payment fetched:', job?.payment);
    console.log('DEBUG: status fetched:', job?.payment.status);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return{
      ...job,
      paymentStatus: job.payment?.status ?? null,
      }
  }

}

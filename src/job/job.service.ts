import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { JobStatus } from '../job/job-status.enum';
import { CreateJobDto } from '../dto/create-job.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobsRepo: Repository<Job>,
  ) {}

  async createJob(client: User, dto: CreateJobDto) {
    const job = this.jobsRepo.create({
      ...dto,
      client,
      status: JobStatus.PENDING,
    });

    return this.jobsRepo.save(job);
  }

  notifyTechnician(tech: User, job: Job) {
    console.log(`Notify ${tech.fullName} about job ${job.id}`);
  }

  /** TECHNICIAN ACCEPT JOB */
  async acceptJob(technician: User, jobId: number) {
    if (!technician.isAvailable) {
      throw new ForbiddenException('Technician not available');
    }

    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician'],
    });

    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.PENDING) {
      throw new ForbiddenException('Job not available');
    }

    job.technician = technician;
    job.status = JobStatus.ACCEPTED;

    return this.jobsRepo.save(job);
  }


  /** TECHNICIAN DECLINE JOB */
  async declineJob(technician: User, jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');

    if (job.status !== JobStatus.PENDING)
      throw new ForbiddenException('Cannot decline');

    return job; // no change, stays Pending
  }


  /** GET JOBS FOR USER */
  async getMyJobs(user: User) {
    if (user.role === 'client') {
      return this.jobsRepo.find({ where: { client: { id: user.id } }, relations: ['technician', 'client'] });
    } else if (user.role === 'technician') {
      return this.jobsRepo.find({ where: { technician: { id: user.id } }, relations: ['technician', 'client'] });
    }
    return [];
  }

  /** GET PENDING/ASSIGNED JOBS FOR TECH */
  async getAssignedJobs(user: User) {
    return this.jobsRepo.find({
      where: [
        { status: JobStatus.PENDING },
        { technician: { id: user.id } },
      ],
      relations: ['technician', 'client'],
    });
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
    if (job.status === JobStatus.PENDING || job.status === JobStatus.UNASSIGNED) {
      job.status = JobStatus.ASSIGNED;
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





}

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


}

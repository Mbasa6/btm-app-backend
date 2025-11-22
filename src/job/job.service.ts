import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, JobStatus } from '../entities/job.entity';
import { CreateJobDto } from '../dto/create-job.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobsRepo: Repository<Job>,
  ) {}

  // Client creates a job
  async createJob(client: User, createJobDto: CreateJobDto) {
    const job = this.jobsRepo.create({
      ...createJobDto,
      client,
      status: 'pending',
    });
    await this.jobsRepo.save(job);
    return job;
  }

  // Get jobs for the logged-in user
  async getMyJobs(user: User) {
    if (user.role === 'client') {
      return this.jobsRepo.find({
          where: { client: { id: user.id } },
          relations: ['technician', 'client'],
         });
    } else if (user.role === 'technician') {
      return this.jobsRepo.find({
          where: { technician: { id: user.id } },
          relations: ['technician', 'client'],
         });
    }
    return [];
  }

  // Get all pending jobs (for technicians)
  async getPendingJobs() {
    return this.jobsRepo.find({
        where: { status: 'pending' },
        relations: ['technician', 'client'],
       });
  }

  // Technician accepts a job
  async acceptJob(user: User, jobId: number) {
    if (user.role !== 'technician') throw new ForbiddenException('Only technicians can accept jobs');

    const job = await this.jobsRepo.findOne({
        where: { id: jobId },
         relations: ['technician', 'client'],
         });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'pending') throw new ForbiddenException('Job already accepted');

    job.status = 'accepted';
    job.technician = user;

    await this.jobsRepo.save(job);
    return job;

    return this.jobsRepo.findOne({
        where: { id: job?.id },
        relations: ['technician', 'client'],
      });
  }
}

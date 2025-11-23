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
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  /** CREATE JOB & AUTO ASSIGN */
  async createJob(client: User, dto: CreateJobDto) {
    const job = this.jobsRepo.create({
      ...dto,
      client,
      status: 'unassigned',
    });
    await this.jobsRepo.save(job);

    await this.autoAssignJob(job);
    return job;
  }

  /** AUTO-ASSIGN TO NEAREST/AVAILABLE TECH */
  async autoAssignJob(job: Job): Promise<Job> {
    // Fetch available technicians
    const techs = await this.userRepo.find({
      where: { role: 'technician', isAvailable: true },
    });

    if (!techs.length) {
      job.status = 'unassigned';
      await this.jobsRepo.save(job);
      return job;
    }

    // For now: assign first available (replace with nearest logic later)
    const tech = techs[0];
    job.technician = tech;
    job.status = 'assigned';
    await this.jobsRepo.save(job);

    // Notify technician (pseudo)
    this.notifyTechnician(tech, job);
    return job;
  }

  notifyTechnician(tech: User, job: Job) {
    console.log(`Notify ${tech.fullName} about job ${job.id}`);
  }

  /** TECHNICIAN ACCEPT JOB */
  async acceptJob(technician: User, jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId }, relations: ['technician', 'client'] });
    if (!job) throw new NotFoundException('Job not found');
    if (!job.technician || job.technician.id !== technician.id)
      throw new ForbiddenException('Job not assigned to you');
    if (job.status !== 'assigned') throw new ForbiddenException('Cannot accept this job');

    job.status = 'accepted';
    await this.jobsRepo.save(job);
    return job;
  }

  /** TECHNICIAN DECLINE JOB */
  async declineJob(technician: User, jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId }, relations: ['technician', 'client'] });
    if (!job) throw new NotFoundException('Job not found');
    if (!job.technician || job.technician.id !== technician.id)
      throw new ForbiddenException('Job not assigned to you');
    if (job.status !== 'assigned') throw new ForbiddenException('Cannot decline this job');

    job.status = 'declined';
    job.technician = null;
    await this.jobsRepo.save(job);

    // Auto-assign next available
    await this.autoAssignJob(job);
    return job;
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
      where: { technician: { id: user.id }, status: 'assigned' },
      relations: ['technician', 'client'],
    });
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createJob(data: any, userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const job = this.jobRepo.create({ ...data, createdBy: user });
    return this.jobRepo.save(job);
  }

  async listJobs() {
    return this.jobRepo.find({ relations: ['createdBy'] });
  }
}

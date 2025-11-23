import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, User])],
  providers: [JobService],
  controllers: [JobController],
})
export class JobModule {}

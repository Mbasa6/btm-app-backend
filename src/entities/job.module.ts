import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';
import { JobService } from '../job/job.service';
import { JobController } from '../job/job.controller';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, User])],
  controllers: [JobController],
  providers: [JobService],
})
export class JobModule {}

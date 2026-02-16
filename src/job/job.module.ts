import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../entities/job.entity';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { User } from '../entities/user.entity';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { ServiceItem } from '../entities/service-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, User, ServiceItem]), UserModule],
  providers: [JobService],
  controllers: [JobController],
})
export class JobModule {}

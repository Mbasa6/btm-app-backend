import { Controller, Post, Get, Param, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../entities/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobController {
  constructor(private jobService: JobService) {}

  @Post()
  @Roles('client')
  createJob(@GetUser() user: User, @Body() dto: CreateJobDto) {
    return this.jobService.createJob(user, dto);
  }

  @Get('my')
  @Roles('client', 'technician')
  getMyJobs(@GetUser() user: User) {
    return this.jobService.getMyJobs(user);
  }

  @Get('assigned')
  @Roles('technician')
  getAssignedJobs(@GetUser() user: User) {
    return this.jobService.getAssignedJobs(user);
  }

  @Post(':id/accept')
  @Roles('technician')
  acceptJob(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.jobService.acceptJob(user, id);
  }

  @Post(':id/decline')
  @Roles('technician')
  declineJob(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.jobService.declineJob(user, id);
  }

  @Get()
  @Roles('admin')
  getAllJobs() {
    return this.jobService.getAllJobs();
  }

  @Put(':id/status')
  @Roles('admin')
  updateJobStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobService.updateJobStatus(id, dto.status);
  }


}

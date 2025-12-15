import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';

import { JobService } from './job.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { JobStatus } from '../job/job-status.enum';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { IsActiveGuard } from '../auth/is-active.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../entities/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard, IsActiveGuard)
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

  @Patch(':id/assign/:techId')
  @Roles('admin')
  assignTechnician(
    @Param('id', ParseIntPipe) jobId: number,
    @Param('techId', ParseIntPipe) techId: number,
  ) {
    return this.jobService.assignTechnician(jobId, techId);
  }

  @Patch(':id/close')
  @Roles('admin')
  forceCloseJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.forceCloseJob(id);
  }

  @Get('filter')
  @Roles('admin')
  filterJobs(
    @Query('status') status?: JobStatus,
    @Query('technicianId') technicianId?: number,
    @Query('clientId') clientId?: number,
  ) {
    return this.jobService.filterJobs({ status, technicianId, clientId });
  }





}

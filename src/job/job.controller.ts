import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { JobService } from './job.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('jobs')
export class JobController {
  constructor(private jobService: JobService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  createJob(@Body() body: any, @Req() req) {
    return this.jobService.createJob(body, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  listJobs() {
    return this.jobService.listJobs();
  }
}

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
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { JobService } from './job.service';
import { CreateJobDto } from '../dto/create-job.dto';
import { RateJobDto } from '../dto/rate-job.dto';
import { JobStatus } from '../job/job-status.enum';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { IsActiveGuard } from '../auth/is-active.guard';
import { ApprovalGuard } from '../auth/approval.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../entities/user.entity';

// ── Multer storage factory ─────────────────────────────────────────────────
const imageStorage = (subfolder: string) =>
  diskStorage({
    destination: (_req, _file, cb) => {
      const dir = join(process.cwd(), 'uploads', 'jobs', subfolder);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  });

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard, IsActiveGuard, ApprovalGuard)
export class JobController {
  constructor(private jobService: JobService) {}

  // ── POST /jobs — client creates booking with optional reference photos ─────
  @Post()
  @Roles('client')
  @UseInterceptors(
    FilesInterceptor('clientImages', 4, { storage: imageStorage('client') }),
  )
  createJob(
    @GetUser() user: User,
    @Body() dto: CreateJobDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const clientImagePaths = (files ?? []).map(
      (f) => `/uploads/jobs/client/${f.filename}`,
    );
    return this.jobService.createJob(user, dto, clientImagePaths);
  }

  // ── GET /jobs/my ───────────────────────────────────────────────────────────
  @Get('my')
  @Roles('client', 'technician')
  getMyJobs(@GetUser() user: User) {
    return this.jobService.getMyJobs(user);
  }

  // ── GET /jobs/assigned ─────────────────────────────────────────────────────
  @Get('assigned')
  @Roles('technician')
  getAssignedJobs(@GetUser() user: User) {
    return this.jobService.getAssignedJobs(user);
  }

  // ── POST /jobs/:id/accept ──────────────────────────────────────────────────
  @Post(':id/accept')
  @Roles('technician')
  acceptJob(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.jobService.acceptJob(user, id);
  }

  // ── POST /jobs/:id/decline ─────────────────────────────────────────────────
  @Post(':id/decline')
  @Roles('technician')
  declineJob(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.jobService.declineJob(user, id);
  }

  // ── GET /jobs (admin) ──────────────────────────────────────────────────────
  @Get()
  @Roles('admin')
  getAllJobs() {
    return this.jobService.getAllJobs();
  }

  // ── PUT /jobs/:id/status ───────────────────────────────────────────────────
  @Put(':id/status')
  @Roles('admin', 'technician')
  updateJobStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobService.updateJobStatus(id, dto.status);
  }

  // ── PATCH /jobs/:id/assign/:techId ─────────────────────────────────────────
  @Patch(':id/assign/:techId')
  @Roles('admin')
  assignTechnician(
    @Param('id', ParseIntPipe) jobId: number,
    @Param('techId', ParseIntPipe) techId: number,
  ) {
    return this.jobService.assignTechnician(jobId, techId);
  }

  // ── PATCH /jobs/:id/close ──────────────────────────────────────────────────
  @Patch(':id/close')
  @Roles('admin')
  forceCloseJob(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.forceCloseJob(id);
  }

  // ── GET /jobs/filter ───────────────────────────────────────────────────────
  @Get('filter')
  @Roles('admin')
  filterJobs(
    @Query('status') status?: JobStatus,
    @Query('technicianId') technicianId?: number,
    @Query('clientId') clientId?: number,
  ) {
    return this.jobService.filterJobs({ status, technicianId, clientId });
  }

  // ── PATCH /jobs/:id/before-images — technician takes before photo on site ──
  @Patch(':id/before-images')
  @Roles('technician')
  @UseInterceptors(
    FilesInterceptor('beforeImages', 4, { storage: imageStorage('before') }),
  )
  uploadBeforeImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    const beforeImagePaths = (files ?? []).map(
      (f) => `/uploads/jobs/before/${f.filename}`,
    );
    return this.jobService.addBeforeImages(id, beforeImagePaths, user);
  }

  // ── PATCH /jobs/:id/after-images — technician takes after photo on completion
  @Patch(':id/after-images')
  @Roles('technician')
  @UseInterceptors(
    FilesInterceptor('afterImages', 4, { storage: imageStorage('after') }),
  )
  uploadAfterImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @GetUser() user: User,
  ) {
    const afterImagePaths = (files ?? []).map(
      (f) => `/uploads/jobs/after/${f.filename}`,
    );
    return this.jobService.addAfterImages(id, afterImagePaths, user);
  }

  // ── POST /jobs/:id/rating — client rates completed job ─────────────────────
  @Post(':id/rating')
  @Roles('client')
  submitRating(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateJobDto,
    @GetUser() user: User,
  ) {
    return this.jobService.submitRating(id, dto, user);
  }

  // ── PATCH /jobs/:id/revert-pending — admin reverts job to pending ────────────
  @Patch(':id/revert-pending')
  @Roles('admin')
  revertToPending(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.revertToPending(id);
  }

  // ── GET /jobs/:id — keep last to avoid swallowing named routes ─────────────
  @Get(':id')
  @Roles('admin', 'client', 'technician')
  getJobById(@Param('id', ParseIntPipe) id: number) {
    return this.jobService.getJobById(id);
  }
}
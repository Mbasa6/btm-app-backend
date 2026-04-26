import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../entities/job.entity';
import { User } from '../entities/user.entity';
import { JobStatus } from '../job/job-status.enum';
import { CreateJobDto } from '../dto/create-job.dto';
import { PaymentStatus } from '../payment/payment-status.enum';
import { ServiceItem } from '../entities/service-item.entity';
import { RateJobDto } from '../dto/rate-job.dto';

const JOB_RADIUS_KM = 20;
const PAYOUT_FLOOR = 500;

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobsRepo: Repository<Job>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(ServiceItem)
    private serviceItemRepo: Repository<ServiceItem>,
  ) {}

  // ─── CREATE JOB ─────────────────────────────────────────────────────────
  async createJob(client: User, dto: CreateJobDto, clientImagePaths: string[] = []) {
    const serviceItem = await this.serviceItemRepo.findOne({ where: { id: dto.serviceItemId } });
    if (!serviceItem) throw new NotFoundException('Service item not found');

    const job = this.jobsRepo.create({
      ...dto,
      client,
      status: JobStatus.PENDING,
      serviceItem,
      clientLatitude: dto.clientLatitude ?? null,
      clientLongitude: dto.clientLongitude ?? null,
      clientImages: clientImagePaths,
      beforeImages: null as any,
      afterImages: null as any,
    });

    return this.jobsRepo.save(job);
  }

  notifyTechnician(tech: User, job: Job) {
    console.log(`Notify ${tech.fullName} about job ${job.id}`);
  }

  // ─── TECHNICIAN ACCEPT JOB ───────────────────────────────────────────────
  async acceptJob(technician: User, jobId: number) {
    const freshTech = await this.userRepo.findOne({ where: { id: technician.id } });

    if (!freshTech || !freshTech.isAvailable) {
      throw new ForbiddenException('Technician not available');
    }

    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician', 'payment', 'serviceItem'], // ← serviceItem needed for payout
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.PENDING) throw new ForbiddenException('Job not available');

    // 🔐 PAYMENT GATE
    if (!job.payment || job.payment.status !== PaymentStatus.PAID) {
      throw new ForbiddenException('Job not dispatchable');
    }

    job.technician = freshTech;
    job.status = JobStatus.ACCEPTED;
    job.acceptedAt = new Date();

    // ── Auto-calculate payout when technician accepts ─────────────────────
    if (job.clientPrice != null && job.serviceItem?.technicianPercentage != null) {
      const pct = job.serviceItem.technicianPercentage;
      job.technicianPercentage = pct;
      job.technicianPayout = Math.max(job.clientPrice * pct, 500);
      job.payoutLocked = true;
      job.dispatchedAt = new Date();
    }

    return this.jobsRepo.save(job);
  }

  // ─── TECHNICIAN DECLINE JOB ──────────────────────────────────────────────
  async declineJob(technician: User, jobId: number) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician', 'declinedBy'],
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== JobStatus.PENDING) throw new ForbiddenException('Cannot decline');

    if (!job.declinedBy) job.declinedBy = [];
    job.declinedBy.push(technician);

    if (job.technician?.id === technician.id) {
      job.technician = null;
    }

    return this.jobsRepo.save(job);
  }

  // ─── GET JOBS FOR USER ───────────────────────────────────────────────────
  async getMyJobs(user: User) {
    if (user.role === 'client') {
      return this.jobsRepo.find({
        where: { client: { id: user.id } },
        relations: ['technician', 'client', 'payment'],
      });
    } else if (user.role === 'technician') {
      return this.jobsRepo.find({
        where: { technician: { id: user.id } },
        relations: ['technician', 'client'],
      });
    }
    return [];
  }

  // ─── GET PENDING JOBS FOR TECHNICIAN ─────────────────────────────────────
  async getAssignedJobs(technician: User) {
    const freshTech = await this.userRepo.findOne({ where: { id: technician.id } });
    if (!freshTech) throw new NotFoundException('Technician not found');

    const jobs = await this.jobsRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.payment', 'payment')
      .leftJoinAndSelect('job.declinedBy', 'declinedBy')
      .leftJoinAndSelect('job.serviceItem', 'serviceItem')
      .where('job.status = :status', { status: JobStatus.PENDING })
      .andWhere('payment.status = :paid', { paid: PaymentStatus.PAID })
      .andWhere(
        ':techId NOT IN (SELECT userId FROM job_declined_by_user WHERE jobId = job.id)',
        { techId: technician.id },
      )
      .getMany();

    if (freshTech.latitude == null || freshTech.longitude == null) {
      return jobs.map(job => ({ ...job, distanceKm: null }));
    }

    const nearbyJobs = jobs
      .map(job => {
        if (job.clientLatitude == null || job.clientLongitude == null) {
          return { ...job, distanceKm: null };
        }
        const distanceKm = this.haversineKm(
          freshTech.latitude!,
          freshTech.longitude!,
          job.clientLatitude,
          job.clientLongitude,
        );
        return { ...job, distanceKm };
      })
      .filter(job => job.distanceKm === null || job.distanceKm <= JOB_RADIUS_KM)
      .sort((a, b) => {
        if (a.distanceKm === null) return 1;
        if (b.distanceKm === null) return -1;
        return a.distanceKm - b.distanceKm;
      });

    return nearbyJobs;
  }

  // ─── ADMIN: GET ALL JOBS ─────────────────────────────────────────────────
  async getAllJobs() {
    return this.jobsRepo.find({
      relations: ['client', 'technician'],
      order: { id: 'DESC' },
    });
  }

  // ─── STATUS TRANSITION ───────────────────────────────────────────────────
  private readonly validTransitions = {
    [JobStatus.PENDING]: [JobStatus.ACCEPTED],
    [JobStatus.ACCEPTED]: [JobStatus.IN_PROGRESS],
    [JobStatus.IN_PROGRESS]: [JobStatus.COMPLETED],
    [JobStatus.COMPLETED]: [JobStatus.CLOSED],
  };

  async updateJobStatus(jobId: number, newStatus: JobStatus) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['payment'],
    });
    if (!job) throw new NotFoundException('Job not found');

    const allowed = this.validTransitions[job.status];
    if (!allowed?.includes(newStatus)) {
      throw new ForbiddenException('Invalid job status transition');
    }

    if (job.status === JobStatus.PENDING && newStatus === JobStatus.ACCEPTED) {
      if (!job.payment || job.payment.status !== PaymentStatus.PAID) {
        throw new ForbiddenException('Payment must be completed before accepting this job.');
      }
    }

    job.status = newStatus;
    return this.jobsRepo.save(job);
  }

  // ─── ADMIN: ASSIGN TECHNICIAN + CALCULATE PAYOUT ─────────────────────────
  async assignTechnician(jobId: number, technicianId: number) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician', 'client', 'serviceItem'], // ← serviceItem required for payout
    });
    if (!job) throw new NotFoundException('Job not found');

    const tech = await this.userRepo.findOne({
      where: { id: technicianId, role: 'technician', isActive: true },
    });
    if (!tech) throw new NotFoundException('Technician not found or inactive');

    job.technician = tech;
    if (job.status === JobStatus.PENDING) job.status = JobStatus.ACCEPTED;

    // ── Auto-calculate payout on dispatch ────────────────────────────────────
    if (job.clientPrice != null && job.serviceItem?.technicianPercentage != null) {
      const pct = job.serviceItem.technicianPercentage;
      job.technicianPercentage = pct;
      job.technicianPayout = Math.max(job.clientPrice * pct, PAYOUT_FLOOR);
      job.payoutLocked = true;
      job.dispatchedAt = new Date();
    }

    return this.jobsRepo.save(job);
  }

  async forceCloseJob(jobId: number) {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    job.status = JobStatus.CLOSED;
    return this.jobsRepo.save(job);
  }

  async filterJobs(filters: { status?: JobStatus; technicianId?: number; clientId?: number }) {
    const query = this.jobsRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.client', 'client')
      .leftJoinAndSelect('job.technician', 'technician');

    if (filters.status) query.andWhere('job.status = :status', { status: filters.status });
    if (filters.technicianId) query.andWhere('technician.id = :techId', { techId: filters.technicianId });
    if (filters.clientId) query.andWhere('client.id = :clientId', { clientId: filters.clientId });

    return query.orderBy('job.id', 'DESC').getMany();
  }

  async getJobById(jobId: number) {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['client', 'technician', 'payment', 'serviceItem'], // ← serviceItem added
    });

    if (!job) throw new NotFoundException('Job not found');

    return {
      ...job,
      paymentStatus: job.payment?.status ?? null,
    };
  }

  // ─── TECHNICIAN UPLOADS BEFORE IMAGES ────────────────────────────────────
  async addBeforeImages(jobId: number, beforeImagePaths: string[], technician: User): Promise<Job> {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician'],
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.technician?.id !== technician.id) {
      throw new ForbiddenException('Only the assigned technician can upload before photos.');
    }
    if (job.status !== JobStatus.ACCEPTED) {
      throw new BadRequestException('Job must be accepted to upload before photos.');
    }
    job.beforeImages = [...(job.beforeImages ?? []), ...beforeImagePaths];
    return this.jobsRepo.save(job);
  }

  // ─── TECHNICIAN UPLOADS AFTER IMAGES ─────────────────────────────────────
  async addAfterImages(jobId: number, afterImagePaths: string[], technician: User): Promise<Job> {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['technician'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.technician?.id !== technician.id) {
      throw new ForbiddenException('Only the assigned technician can upload after photos.');
    }
    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException('Job must be in progress to upload after photos.');
    }

    job.afterImages = [...(job.afterImages ?? []), ...afterImagePaths];
    return this.jobsRepo.save(job);
  }

  // ─── CLIENT SUBMITS RATING ────────────────────────────────────────────────
  async submitRating(jobId: number, dto: RateJobDto, client: User): Promise<Job> {
    const job = await this.jobsRepo.findOne({
      where: { id: jobId },
      relations: ['client'],
    });
    if (!job) throw new NotFoundException('Job not found');

    if (job.client?.id !== client.id) {
      throw new ForbiddenException('Only the client who booked this job can rate it.');
    }
    if (job.status !== JobStatus.COMPLETED && job.status !== JobStatus.CLOSED) {
      throw new BadRequestException('You can only rate a completed job.');
    }
    if (job.rating != null) {
      throw new BadRequestException('This job has already been rated.');
    }

    job.rating = dto.rating;
    job.feedback = dto.feedback ?? null;
    return this.jobsRepo.save(job);
  }

  // ─── ADMIN: REVERT JOB TO PENDING ────────────────────────────────────────
  async revertToPending(jobId: number): Promise<Job> {
    const job = await this.jobsRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (!['accepted', 'in_progress'].includes(job.status)) {
      throw new BadRequestException('Only accepted or in_progress jobs can be reverted to pending.');
    }
    job.status = JobStatus.PENDING;
    job.technician = null;
    return this.jobsRepo.save(job);
  }

  // ─── HAVERSINE HELPER ─────────────────────────────────────────────────────
  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}


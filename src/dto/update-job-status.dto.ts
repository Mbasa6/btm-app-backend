import { IsEnum } from 'class-validator';
import { JobStatus } from '../jobs/job-status.enum';

export class UpdateJobStatusDto {
  @IsEnum(JobStatus)
  status: JobStatus;
}

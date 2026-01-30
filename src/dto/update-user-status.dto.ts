import { IsBoolean, IsEnum } from 'class-validator';
import { ApprovalStatus } from '../user/approval-status.enum';

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;

  @IsEnum(ApprovalStatus)
    approvalStatus: ApprovalStatus;
}

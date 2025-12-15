import { IsEnum } from 'class-validator';

export enum UserRole {
  CLIENT = 'client',
  TECHNICIAN = 'technician',
  ADMIN = 'admin',
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

import { IsNotEmpty, IsString, IsOptional, IsNumber, IsEmail } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  serviceItemId: number;


  @IsNotEmpty()
  @IsString()
  address: string;

  // GPS coordinates — now fully optional, kept for backwards compat only.
  // getAssignedJobs will still use them for proximity filtering if present.
  @IsOptional()
  @IsNumber()
  clientLatitude?: number;

  @IsOptional()
  @IsNumber()
  clientLongitude?: number;

  // Admin-only: create a booking on behalf of an existing client account.
  @IsOptional()
  @IsNumber()
  clientId?: number;

  @IsOptional()
  @IsString()
  manualClientName?: string;

  @IsOptional()
  @IsString()
  manualClientSurname?: string;

  @IsOptional()
  @IsEmail()
  manualClientEmail?: string;

  @IsOptional()
  @IsString()
  manualClientPhone?: string;
}
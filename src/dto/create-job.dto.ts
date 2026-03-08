import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  serviceItemId: number;

  // Client's GPS at time of booking — sent from the Expo app
  @IsOptional()
  @IsNumber()
  clientLatitude?: number;

  @IsOptional()
  @IsNumber()
  clientLongitude?: number;
}
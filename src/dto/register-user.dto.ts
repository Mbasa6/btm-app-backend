import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

// Defines the allowed roles for validation
const validRoles = ['client', 'technician', 'admin'];

export class RegisterUserDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email: string;

  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  @IsIn(validRoles, { message: `Role must be one of: ${validRoles.join(', ')}` })
  role?: 'client' | 'technician' | 'admin';

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
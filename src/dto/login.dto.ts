import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
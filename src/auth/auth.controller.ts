import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordRequestDto } from '../dto/forgot-password-request.dto';
import { ResetPasswordConfirmDto } from '../dto/reset-password-confirm.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('password-reset/request')
  @UsePipes(new ValidationPipe({ transform: true }))
  requestPasswordReset(@Body() requestDto: ForgotPasswordRequestDto) {
    return this.authService.requestPasswordReset(requestDto);
  }

  @Post('password-reset/confirm')
  @UsePipes(new ValidationPipe({ transform: true }))
  confirmPasswordReset(@Body() confirmDto: ResetPasswordConfirmDto) {
    return this.authService.confirmPasswordReset(confirmDto);
  }
}

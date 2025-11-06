import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() body: any) {
    const { email, password, fullName } = body;
    return this.authService.register(email, password, fullName);
  }

  @Post('login')
  login(@Body() body: any) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }

  @UseGuards(JwtAuthGuard)
    @Get('profile')
    getProfile(@Request() req: any) {
      return {
        message: 'Access granted',
        user: req.user,
      };
    }
}

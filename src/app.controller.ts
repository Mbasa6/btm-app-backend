import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';

@Controller('test')
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'Backend running', db: 'Connected' };
  }

   @Get('admin-only')
    @UseGuards(JwtAuthGuard)
    @Roles('admin')
    adminOnly() {
      return { message: 'Admin access granted ✔' };
    }

    @Get('tech-only')
    @UseGuards(JwtAuthGuard)
    @Roles('technician')
    technicianOnly() {
      return { message: 'Technician access granted ✔' };
    }

    @Get('client-only')
    @UseGuards(JwtAuthGuard)
    @Roles('client')
    clientOnly() {
      return { message: 'Client access granted ✔' };
    }
}


import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Roles } from './auth/roles.decorator';
import { RolesGuard } from './auth/roles.guard';

@Controller('test')
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'Backend running', db: 'Connected' };
  }

   @Get('admin-only')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    adminOnly() {
      return { message: 'Admin access granted ✔' };
    }

    @Get('tech-only')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('technician')
    technicianOnly() {
      return { message: 'Technician access granted ✔' };
    }

    @Get('client-only')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('client')
    clientOnly() {
      return { message: 'Client access granted ✔' };
    }
}


import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('technicians')
  @Roles('admin')
  getAllTechnicians() {
    return this.userService.getAllTechnicians();
  }

  @Get() // <--- The root path /users
  @Roles('admin') // Only users with the 'admin' role can access this
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
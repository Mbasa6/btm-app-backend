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

  @Put(':id/status')
  @Roles('admin')
  updateUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserStatus(id, dto.isActive);
  }

  @Put(':id/role')
  @Roles('admin')
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(id, dto.role);
  }

  @Put(':id/availability')
  @Roles('admin')
  updateAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.userService.updateTechnicianAvailability(
      id,
      dto.isAvailable,
    );
  }

  @Get(':id/jobs')
  @Roles('admin')
  getUserJobs(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserJobs(id);
  }

  @Patch(':id/activate')
  @Roles('admin')
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.setUserActiveStatus(id, true);
  }

  @Patch(':id/deactivate')
  @Roles('admin')
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.setUserActiveStatus(id, false);
  }

}
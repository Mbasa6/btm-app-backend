import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateUserRoleDto } from '../dto/update-user-role.dto';
import { UpdateAvailabilityDto } from '../dto/update-availability.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UpdateJobStatusDto } from '../dto/update-job-status.dto';


@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('technicians')
  @Roles('admin')
  getAllTechnicians() {
    return this.userService.getAllTechnicians();
  }

  @Get('clients')
    @Roles('admin')
    getAllClients() {
      return this.userService.getAllClients();
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
  @Roles('admin', 'technician')
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

  @Get(':id')
  @Roles('admin')
  findUserById(@Param('id', ParseIntPipe) id: number) {
      return this.userService.findById(id)
      }

  // user.controller.ts
  @Put(':id/approvalStatus')
  @Roles('admin')
  updateUserApprovalStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateUserApprovalStatus(id, dto);
  }

}
import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { IsActiveGuard } from '../auth/is-active.guard';
import { ApprovalGuard } from '../auth/approval.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { User } from '../entities/user.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard, IsActiveGuard, ApprovalGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @Roles('admin', 'technician', 'client')
  getMyNotifications(
    @GetUser() user: User,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.notificationService.getMyNotifications(user.id, parsedLimit);
  }

  @Patch(':id/read')
  @Roles('admin', 'technician', 'client')
  markAsRead(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationService.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @Roles('admin', 'technician', 'client')
  markAllAsRead(@GetUser() user: User) {
    return this.notificationService.markAllAsRead(user.id);
  }
}


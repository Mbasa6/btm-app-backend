// src/auth/is-active.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class IsActiveGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const freshUser = await this.userService.findById(user.id);
    if (!freshUser.isActive) {

    }

    return true;
  }
}

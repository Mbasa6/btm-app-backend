// src/auth/is-active.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class IsActiveGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('Unauthorized user context');
    }

    const freshUser = await this.userService.findById(user.id);
    if (!freshUser.isActive) {
      // Pending/inactive users can access read-only endpoints, but not perform mutations.
      if (request.method !== 'GET') {
        throw new ForbiddenException('Your account is inactive. This action is unavailable until approval.');
      }
    }

    return true;
  }
}

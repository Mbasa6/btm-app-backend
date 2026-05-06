import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class ApprovalGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (user.approvalStatus !== 'APPROVED') {
      if (req.method !== 'GET') {
        throw new ForbiddenException('Account not approved');
      }
    }

    return true;
  }
}

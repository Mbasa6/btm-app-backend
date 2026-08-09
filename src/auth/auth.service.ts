import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { NotificationService } from '../notification/notification.service';
import { ForgotPasswordRequestDto } from '../dto/forgot-password-request.dto';
import { ResetPasswordConfirmDto } from '../dto/reset-password-confirm.dto';
import { MailerService } from '../mailer/mailer.service';

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_REQUEST_THROTTLE_MS = 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, fullName, role, phoneNumber } = registerDto;

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email: normalizedEmail } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashed = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({
      email: normalizedEmail,
      password: hashed,
      fullName,
      role,
      phoneNumber,
      isActive: role === 'admin' ? true : false,
    });

    const saved = await this.usersRepo.save(user);

    // Welcome notification for new client/technician accounts.
    if (role !== 'admin') {
      await this.notificationService.createForUser(
        saved,
        'Welcome to BTM Fibre Connect!',
        `Hi ${fullName}, your account has been created. Our admin team will review and approve it within 24-48 hours. You'll be notified once approved.`,
        'general',
      );
    }

    return {
      message:
        'Account created successfully. Please wait for admin approval before booking jobs or receiving assignments.',
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepo.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role, approvalStatus: user.approvalStatus };
    const token = await this.jwtService.signAsync(payload);

    return {
      access_token: token,
      role: user.role,
      userId: user.id,
      approvalStatus: user.approvalStatus,
      isActive: user.isActive,
    };
  }

  async requestPasswordReset(requestDto: ForgotPasswordRequestDto) {
    const email = requestDto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });

    // Always return a generic message to avoid exposing valid account emails.
    if (!user) {
      return { message: 'If an account exists, a reset code has been sent.' };
    }

    const now = new Date();
    const lastRequestedAt = user.passwordResetLastRequestedAt;

    if (lastRequestedAt && now.getTime() - new Date(lastRequestedAt).getTime() < RESET_REQUEST_THROTTLE_MS) {
      return { message: 'If an account exists, a reset code has been sent.' };
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);

    user.passwordResetCodeHash = codeHash;
    user.passwordResetExpiresAt = new Date(now.getTime() + RESET_CODE_TTL_MS);
    user.passwordResetAttemptCount = 0;
    user.passwordResetLastRequestedAt = now;
    await this.usersRepo.save(user);

    try {
      await this.mailerService.sendPasswordResetCode(email, code);
      console.log(`[BTM][PasswordReset] Reset code email sent to ${email}`);
    } catch (error: any) {
      console.error(`[BTM][PasswordReset] Failed to send reset code email to ${email}:`, error?.message || error);

      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException('Unable to send reset code right now. Please try again later.');
      }

      // Keep local/dev testing unblocked when SMTP is unavailable.
      console.log(`[BTM][PasswordReset][DEV] ${email} reset code: ${code}`);
    }

    const response: { message: string; resetCode?: string } = {
      message: 'If an account exists, a reset code has been sent.',
    };

    if (process.env.NODE_ENV !== 'production') {
      response.resetCode = code;
    }

    return response;
  }

  async confirmPasswordReset(confirmDto: ResetPasswordConfirmDto) {
    const email = confirmDto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });

    if (!user || !user.passwordResetCodeHash || !user.passwordResetExpiresAt) {
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    const now = new Date();
    if (new Date(user.passwordResetExpiresAt).getTime() < now.getTime()) {
      user.passwordResetCodeHash = undefined;
      user.passwordResetExpiresAt = undefined;
      user.passwordResetAttemptCount = 0;
      await this.usersRepo.save(user);
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    if ((user.passwordResetAttemptCount ?? 0) >= MAX_RESET_ATTEMPTS) {
      throw new UnauthorizedException('Too many invalid attempts. Request a new reset code.');
    }

    const isValidCode = await bcrypt.compare(confirmDto.code, user.passwordResetCodeHash);

    if (!isValidCode) {
      user.passwordResetAttemptCount = (user.passwordResetAttemptCount ?? 0) + 1;
      await this.usersRepo.save(user);
      throw new UnauthorizedException('Invalid or expired reset code');
    }

    user.password = await bcrypt.hash(confirmDto.newPassword, 10);
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpiresAt = undefined;
    user.passwordResetAttemptCount = 0;
    await this.usersRepo.save(user);

    return { message: 'Password reset successful. You can now sign in with your new password.' };
  }
}

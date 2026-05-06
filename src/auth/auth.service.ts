import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, fullName, role, phoneNumber } = registerDto;

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashed = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({
      email,
      password: hashed,
      fullName,
      role,
      phoneNumber,
      isActive: role === 'admin' ? true : false,
    });

    const saved = await this.usersRepo.save(user);

    // 🔔 Welcome notification for new client/technician
    if (role !== 'admin') {
      await this.notificationService.createForUser(
        saved,
        '👋 Welcome to BTM Fibre Connect!',
        `Hi ${fullName}, your account has been created. Our admin team will review and approve it within 24–48 hours. You'll be notified once approved.`,
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

    const user = await this.usersRepo.findOne({ where: { email } });
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
}

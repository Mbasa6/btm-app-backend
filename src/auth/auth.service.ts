import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto) {
    const { email, password, fullName, role } = registerDto;

    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already registered');

    const hashed = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({ email, password: hashed, fullName, role });
    await this.usersRepo.save(user);

    return { message: 'User registered successfully' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = await this.jwtService.signAsync(payload);

    return {
        access_token: token,
         role: user.role
         };
  }
}

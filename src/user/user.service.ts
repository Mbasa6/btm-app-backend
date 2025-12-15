// src/user/user.service.ts (Hypothetical file)

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity'; // Your User entity

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // ... (existing user methods like findOne, create, etc.)

  getAllTechnicians(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        role: 'technician', // Filter by the 'technician' role
        // Optionally add a status check, e.g., isActive: true
      },
      // Select only necessary fields for the admin list (Name, Email, Status)
      select: ['id', 'fullName', 'email', 'isAvailable', 'role'],
      order: {
        fullName: 'ASC',
      },
    });
  }

  getAllUsers(): Promise<User[]> {
      return this.usersRepository.find({
        // No 'where' clause needed to get all users
        // Select only necessary fields for the admin list
        select: ['id', 'fullName', 'email', 'role', 'isAvailable'],
        order: {
          id: 'ASC',
        },
      });
    }

  async updateUserStatus(userId: number, isActive: boolean): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  async updateUserRole(userId: number, role: UserRole): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    user.role = role;
    return this.usersRepository.save(user);
  }

  async updateTechnicianAvailability(
    userId: number,
    isAvailable: boolean,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'technician') {
      throw new Error('User is not a technician');
    }

    user.isAvailable = isAvailable;
    return this.usersRepository.save(user);
  }

  async getUserJobs(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['clientJobs', 'technicianJobs'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      clientJobs: user.clientJobs,
      technicianJobs: user.technicianJobs,
    };
  }





}
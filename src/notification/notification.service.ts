import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  async createForUser(
    user: User,
    title: string,
    body: string,
    type: NotificationType = 'general',
    data?: Record<string, any>,
  ) {
    const notification = this.notificationRepo.create({
      user,
      title,
      body,
      type,
      isRead: false,
      data: data ?? null,
    });
    return this.notificationRepo.save(notification);
  }

  async getMyNotifications(userId: number, limit = 50) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: Math.max(1, Math.min(limit, 100)),
    });
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user: { id: userId } },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false })
      .execute();

    return { message: 'All notifications marked as read' };
  }
}


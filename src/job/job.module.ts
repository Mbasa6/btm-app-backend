import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { Job } from '../entities/job.entity';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { User } from '../entities/user.entity';
import { UserModule } from '../user/user.module';
import { ServiceItem } from '../entities/service-item.entity';
import { PushNotificationService } from './push-notification.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, User, ServiceItem]),
    UserModule,
    NotificationModule,
    MulterModule.register(),
  ],
  providers: [JobService, PushNotificationService],
  controllers: [JobController],
})
export class JobModule {}
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JobModule } from './job/job.module';
import { ServicesModule } from './services/services.module';
import { PaymentModule } from './payment/payment.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      url: process.env.DATABASE_URL,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      autoLoadEntities: true,
      synchronize: true,

    }),
//    TypeOrmModule.forFeature([User]),
    AuthModule,
    JobModule,
    ServicesModule,
    PaymentModule,
    DashboardModule,
    NotificationModule,
  ],
   controllers: [AppController], // 👈 Make sure this line exists
   providers: [AppService],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private dataSource: DataSource) {}

  async onModuleInit() {
    try {
      if (this.dataSource.isInitialized) {
        this.logger.log('✅ Connected to database successfully');
      } else {
        this.logger.warn('⚠️ Database not initialized');
      }
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error.message);
    }
  }
}

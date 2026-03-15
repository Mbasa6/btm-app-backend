import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // ── Serve uploaded job images as static files ──────────────────────────
  // Before photos: GET /uploads/jobs/before/<filename>
  // After photos:  GET /uploads/jobs/after/<filename>
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: [
      'https://btm-app-backend.onrender.com',
      '*',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 200,
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Server running');
}
bootstrap();
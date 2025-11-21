import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:8082',   // Expo Web
      'http://localhost:19006',  // Expo old web port
      'http://10.157.1.170:8082', // LAN Expo
      'http://10.157.3.69:8082',
      'http://10.0.2.2:8081',     // Android emulator HTTP
      '*',                        // last fallback
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

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:8081', 'http://10.0.2.2:8081'],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
  console.log('🚀 Server running on http://10.157.1.214:3000');
}
bootstrap();

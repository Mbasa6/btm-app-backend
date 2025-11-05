import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return { status: 'Backend running', db: 'Connected' };
  }
}


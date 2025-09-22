import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'influencer-platform-backend',
      version: '1.0.0',
    };
  }

  @Get('api/health')
  @ApiOperation({ summary: 'API health check endpoint' })
  apiHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'influencer-platform-api',
      version: '1.0.0',
      database: 'connected', // В продакшене проверять реальное подключение
    };
  }
}

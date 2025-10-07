import { Controller, Post, Body } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('run')
  async runSeed(@Body() body: { key?: string }) {
    await this.seedService.runSeed(body?.key);
    return { success: true, message: 'Database seeded successfully' };
  }
}


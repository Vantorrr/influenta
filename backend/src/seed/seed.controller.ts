import { Controller, Get, Query } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get('run')
  async run(@Query('key') key?: string) {
    return this.seedService.runSeed(key);
  }
}


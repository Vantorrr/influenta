import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
@ApiTags('App')

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @ApiOperation({ summary: 'Welcome message' })

  @Get()
  @ApiOperation({ summary: 'Welcome message' })
  }
}

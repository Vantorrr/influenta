import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';

class TelegramAuthDto {
  initData: string;
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Authenticate user via Telegram WebApp' })
  @ApiBody({ type: TelegramAuthDto })
  async authenticateWithTelegram(@Body() authData: TelegramAuthDto) {
    return this.authService.authenticateWithTelegram(authData);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser() {
    // TODO: Implement JWT guard and get user from token
    return { message: 'Not implemented yet' };
  }
}

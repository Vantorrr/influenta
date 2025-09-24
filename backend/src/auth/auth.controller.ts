import { Controller, Post, Body, Get, UseGuards, Patch, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

class TelegramAuthDto {
  @IsOptional()
  @IsString()
  initData?: string;

  @IsOptional()
  // Разрешаем произвольные поля пользователя из Telegram (whitelist иначе их режет)
  user?: any;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @ApiOperation({ summary: 'Authenticate user via Telegram WebApp' })
  @ApiBody({ type: TelegramAuthDto })
  async authenticateWithTelegram(
    @Body() authData: TelegramAuthDto,
    @Headers('x-telegram-init-data') initHeader?: string,
  ) {
    // Если заголовок пришёл — подставляем его как initData
    const payload: TelegramAuthDto = {
      initData: authData.initData || initHeader,
      user: authData.user,
    }
    return this.authService.authenticateWithTelegram(payload);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(user.id, dto);
  }
}


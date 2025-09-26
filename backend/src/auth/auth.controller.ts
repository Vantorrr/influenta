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
    console.log('🔵 updateProfile called', { userId: user?.id, dto });
    const res = await this.authService.updateProfile(user.id, dto);
    console.log('🟢 updateProfile saved', res?.user);
    return res;
  }

  @Get('webapp-debug')
  @ApiOperation({ summary: 'Debug what WebApp sends (initData presence etc.)' })
  async debugWebApp(@Headers('x-telegram-init-data') initHeader?: string) {
    return {
      ok: true,
      hasInitHeader: !!initHeader,
      initHeaderLength: initHeader?.length || 0,
      note: 'Если initHeaderLength = 0, Telegram не передал initData. Открой через кнопку в боте.',
    }
  }

  @Get('debug')
  @ApiOperation({ summary: 'Alt debug endpoint' })
  async debugAlt(@Headers('x-telegram-init-data') initHeader?: string) {
    return {
      ok: true,
      endpoint: '/auth/debug',
      hasInitHeader: !!initHeader,
      initHeaderLength: initHeader?.length || 0,
    }
  }

  @Post('request-verification')
  @ApiOperation({ summary: 'Request verification from admins' })
  @UseGuards(JwtAuthGuard)
  async requestVerification(
    @CurrentUser() user: User,
    @Body() data: {
      documents?: string[];
      socialProofs?: {
        platform: string;
        url: string;
        followers?: number;
      }[];
      message?: string;
    }
  ) {
    return this.authService.requestVerification(user.id, data)
  }
}


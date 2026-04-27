import { Controller, Post, Body, Get, UseGuards, Patch, Delete, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/users/entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user via Telegram WebApp' })
  @ApiBody({ type: TelegramAuthDto })
  async authenticateWithTelegram(
    @Body() authData: TelegramAuthDto,
    @Headers('x-telegram-init-data') initHeader?: string,
  ) {
    // Заголовок имеет приоритет, если он непустой — это самый надёжный источник initData
    // (его невозможно случайно подменить телом запроса).
    const initData = (initHeader && initHeader.length > 10 ? initHeader : authData.initData) || undefined;

    return this.authService.authenticateWithTelegram({
      initData,
      user: authData.user,
    });
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

  @Get('webapp-debug')
  @ApiOperation({ summary: 'Debug what WebApp sends (initData presence etc.)' })
  async debugWebApp(@Headers('x-telegram-init-data') initHeader?: string) {
    return {
      ok: true,
      hasInitHeader: !!initHeader,
      initHeaderLength: initHeader?.length || 0,
      note: 'Если initHeaderLength = 0, Telegram не передал initData. Открой через кнопку в боте.',
    };
  }

  @Get('debug')
  @ApiOperation({ summary: 'Alt debug endpoint' })
  async debugAlt(@Headers('x-telegram-init-data') initHeader?: string) {
    return {
      ok: true,
      endpoint: '/auth/debug',
      hasInitHeader: !!initHeader,
      initHeaderLength: initHeader?.length || 0,
    };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete (anonymize) current user account' })
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: User) {
    return this.authService.deleteAccount(user.id);
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
      verificationCode?: string;
    },
  ) {
    return this.authService.requestVerification(user.id, data);
  }
}

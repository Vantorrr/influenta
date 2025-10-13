import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SocialPlatformsService } from './social-platforms.service';
import { CreateSocialPlatformDto } from './dto/create-social-platform.dto';
import { UpdateSocialPlatformDto } from './dto/update-social-platform.dto';

@ApiTags('Social Platforms')
@Controller('social-platforms')
export class SocialPlatformsController {
  constructor(private readonly socialPlatformsService: SocialPlatformsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new social platform' })
  create(
    @CurrentUser() user: any,
    @Body() createDto: CreateSocialPlatformDto,
  ) {
    return this.socialPlatformsService.create(user.id, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all my social platforms' })
  findAll(@CurrentUser() user: any) {
    return this.socialPlatformsService.findAll(user.id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get public social platforms of a user' })
  getUserPlatforms(@Param('userId') userId: string) {
    return this.socialPlatformsService.getUserPlatforms(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific social platform' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.socialPlatformsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a social platform' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateSocialPlatformDto,
  ) {
    return this.socialPlatformsService.update(id, user.id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a social platform' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.socialPlatformsService.remove(id, user.id);
  }

  @Post(':id/screenshot')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add statistics screenshot to platform' })
  addScreenshot(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('screenshotUrl') screenshotUrl: string,
  ) {
    return this.socialPlatformsService.addStatisticsScreenshot(
      id,
      user.id,
      screenshotUrl,
    );
  }
}

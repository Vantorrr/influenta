import { Controller, Get, Param, Body, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AdminOnly } from '../common/decorators/admin.decorator';

@ApiTags('Admin')
@Controller('admin')
@AdminOnly()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get list of admins' })
  async getAdmins() {
    return this.adminService.getAdminsList();
  }

  @Get('verification-requests')
  @ApiOperation({ summary: 'Get users awaiting verification' })
  async getVerificationRequests() {
    return this.adminService.getVerificationRequests();
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Verify a user' })
  async verifyUser(@Param('id') id: string) {
    return this.adminService.verifyUser(id);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Block/unblock a user' })
  async toggleUserBlock(@Param('id') id: string) {
    return this.adminService.toggleUserBlock(id);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Delete a listing' })
  async deleteListing(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.deleteListing(id, reason);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  async getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  @Get('system-info')
  @ApiOperation({ summary: 'Get system information' })
  async getSystemInfo() {
    return this.adminService.getSystemInfo();
  }
}



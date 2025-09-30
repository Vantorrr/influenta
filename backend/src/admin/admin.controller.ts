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

  @Patch('users/:id/unverify')
  @ApiOperation({ summary: 'Unverify a user' })
  async unverifyUser(@Param('id') id: string) {
    return this.adminService.unverifyUser(id);
  }

  @Patch('users/:id/reject-verification')
  @ApiOperation({ summary: 'Reject verification request' })
  async rejectVerification(@Param('id') id: string, @Body() data: { reason: string }) {
    return this.adminService.rejectVerification(id, data.reason);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Block/unblock a user' })
  async toggleUserBlock(@Param('id') id: string) {
    return this.adminService.toggleUserBlock(id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Soft delete (deactivate) a user' })
  async softDeleteUser(@Param('id') id: string) {
    return this.adminService.softDeleteUser(id);
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

  @Get('advertisers')
  @ApiOperation({ summary: 'Get advertisers list for admin' })
  async getAdvertisers() {
    return this.adminService.getAdvertisersList();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent platform activity' })
  async getRecentActivity() {
    return this.adminService.getRecentActivity();
  }

  @Get('top-bloggers')
  @ApiOperation({ summary: 'Get top bloggers' })
  async getTopBloggers() {
    return this.adminService.getTopBloggers();
  }
}


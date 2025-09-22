import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { AdminGuard } from '../guards/admin.guard';

export const ADMIN_KEY = 'isAdmin';

export const IsAdmin = () => SetMetadata(ADMIN_KEY, true);

export function AdminOnly() {
  return applyDecorators(
    IsAdmin(),
    UseGuards(AdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Admin access required' }),
  );
}



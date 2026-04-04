import { Controller, ForbiddenException, Get, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  @Get('stats')
  getAdminStats(@GetUser() user: AuthenticatedUser) {
    if (user.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return {
      totalUsers: 10,
      activeSessions: 5,
      systemHealth: 'Healthy',
    };
  }
}

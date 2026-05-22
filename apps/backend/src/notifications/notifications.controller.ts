import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMine(@GetUser() user: AuthenticatedUser) {
    return this.notificationsService.getMine(user.userId);
  }

  @Patch(':id/read')
  markRead(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markRead(id, user.userId);
  }

  @Patch('read-all')
  markAllRead(@GetUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.userId);
  }
}

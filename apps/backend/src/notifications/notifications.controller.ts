import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import type { AccountProvider } from './entities/connected-account.entity';
import type { TaskPriority } from '../tasks/task.entity';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getMine(@GetUser() user: AuthenticatedUser) {
    return this.notificationsService.getMine(user.userId);
  }

  @Get('digest')
  getDailyDigest(
    @GetUser() user: AuthenticatedUser,
    @Query('date') date?: string,
  ) {
    return this.notificationsService.getDailyDigest(user.userId, date);
  }

  @Get('accounts')
  getAccounts(@GetUser() user: AuthenticatedUser) {
    return this.notificationsService.getConnectedAccounts(user.userId);
  }

  @Post('accounts')
  connectAccount(
    @GetUser() user: AuthenticatedUser,
    @Body()
    body: {
      provider: AccountProvider;
      emailOrUsername?: string;
      accessToken?: string;
      refreshToken?: string;
    },
  ) {
    return this.notificationsService.connectAccount(user.userId, body);
  }

  @Delete('accounts/:id')
  disconnectAccount(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.disconnectAccount(id, user.userId);
  }

  @Post('accounts/:id/sync')
  syncAccount(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.notificationsService.syncAccount(id, user.userId);
  }

  @Post(':id/convert-to-task')
  convertToTask(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body()
    body?: {
      title?: string;
      priority?: TaskPriority;
      dueDate?: string;
    },
  ) {
    return this.notificationsService.convertToTask(id, user.userId, body);
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


import { Controller, Get, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    getMine(@Request() req) {
        return this.notificationsService.getMine(req.user.userId);
    }

    @Patch(':id/read')
    markRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markRead(id, req.user.userId);
    }

    @Patch('read-all')
    markAllRead(@Request() req) {
        return this.notificationsService.markAllRead(req.user.userId);
    }
}

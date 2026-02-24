import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { FocusService } from './focus.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('focus')
@UseGuards(AuthGuard('jwt'))
export class FocusController {
    constructor(private readonly focusService: FocusService) { }

    @Post()
    create(@Request() req, @Body() createDto: any) {
        return this.focusService.create(createDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.focusService.findAll(req.user.userId);
    }

    @Get('stats')
    getStats(@Request() req) {
        return this.focusService.getStats(req.user.userId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.focusService.remove(id, req.user.userId);
    }
}

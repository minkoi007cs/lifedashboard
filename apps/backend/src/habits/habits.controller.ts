import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

@Controller('habits')
@UseGuards(AuthGuard('jwt'))
export class HabitsController {
    constructor(private readonly habitsService: HabitsService) { }

    @Post()
    create(@Request() req, @Body() createHabitDto: CreateHabitDto) {
        return this.habitsService.create(createHabitDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.habitsService.findAll(req.user.userId);
    }

    @Get('statistics')
    getStatistics(@Request() req) {
        return this.habitsService.getStatistics(req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.habitsService.findOne(id, req.user.userId);
    }

    @Put(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateHabitDto: UpdateHabitDto) {
        return this.habitsService.update(id, updateHabitDto, req.user.userId);
    }

    @Post(':id/log')
    log(@Request() req, @Param('id') id: string, @Body('date') date: string, @Body('count') count: number) {
        return this.habitsService.logHabit(id, req.user.userId, date, count);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.habitsService.remove(id, req.user.userId);
    }
}

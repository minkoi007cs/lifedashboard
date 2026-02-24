import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(createTaskDto, req.user.userId);
    }

    @Get()
    findAll(@Request() req) {
        return this.tasksService.findAll(req.user.userId);
    }

    @Get('statistics')
    getStatistics(@Request() req) {
        return this.tasksService.getStatistics(req.user.userId);
    }

    @Get('week/:startDate')
    findWeek(@Request() req, @Param('startDate') startDate: string) {
        return this.tasksService.findWeek(new Date(startDate), req.user.userId);
    }

    @Get('month/:month')
    findMonth(@Request() req, @Param('month') month: string) {
        return this.tasksService.findMonth(month, req.user.userId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.tasksService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
        return this.tasksService.update(id, updateTaskDto, req.user.userId);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.tasksService.remove(id, req.user.userId);
    }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() createTaskDto: CreateTaskDto,
  ) {
    return this.tasksService.create(createTaskDto, user.userId);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.tasksService.findAll(user.userId);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: AuthenticatedUser) {
    return this.tasksService.getStatistics(user.userId);
  }

  @Get('week/:startDate')
  findWeek(
    @GetUser() user: AuthenticatedUser,
    @Param('startDate') startDate: string,
  ) {
    return this.tasksService.findWeek(new Date(startDate), user.userId);
  }

  @Get('month/:month')
  findMonth(@GetUser() user: AuthenticatedUser, @Param('month') month: string) {
    return this.tasksService.findMonth(month, user.userId);
  }

  @Get(':id')
  findOne(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tasksService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, updateTaskDto, user.userId);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.tasksService.remove(id, user.userId);
  }
}

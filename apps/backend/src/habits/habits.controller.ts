import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { HabitsService } from './habits.service';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  create(
    @GetUser() user: AuthenticatedUser,
    @Body() createHabitDto: CreateHabitDto,
  ) {
    return this.habitsService.create(createHabitDto, user.userId);
  }

  @Get()
  findAll(@GetUser() user: AuthenticatedUser) {
    return this.habitsService.findAll(user.userId);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: AuthenticatedUser) {
    return this.habitsService.getStatistics(user.userId);
  }

  @Get(':id')
  findOne(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.findOne(id, user.userId);
  }

  @Put(':id')
  update(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateHabitDto: UpdateHabitDto,
  ) {
    return this.habitsService.update(id, updateHabitDto, user.userId);
  }

  @Post(':id/log')
  log(
    @GetUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('date') date: string,
    @Body('count') count: number,
  ) {
    return this.habitsService.logHabit(id, user.userId, date, count);
  }

  @Delete(':id')
  remove(@GetUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.remove(id, user.userId);
  }
}

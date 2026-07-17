import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/auth-user';
import { CaloriesService } from './calories.service';
import { LogFoodDto } from './dto/log-food.dto';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';

@Controller('calories')
@UseGuards(JwtAuthGuard)
export class CaloriesController {
  constructor(private readonly caloriesService: CaloriesService) {}

  @Post('food')
  logFood(@Body() data: LogFoodDto, @GetUser() user: AuthenticatedUser) {
    return this.caloriesService.logFood(data, user.userId);
  }

  @Delete('food/:id')
  deleteFood(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.caloriesService.deleteFood(id, user.userId);
  }

  @Post('weight')
  logWeight(
    @Body('weight') weight: number,
    @Body('date') date: string,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.caloriesService.logWeight(weight, date, user.userId);
  }

  @Post('plan')
  createDietPlan(
    @Body() data: CreateDietPlanDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.caloriesService.createDietPlan(data, user.userId);
  }

  @Get('plan/:date')
  getPlan(@Param('date') date: string, @GetUser() user: AuthenticatedUser) {
    return this.caloriesService.getDietPlan(date, user.userId);
  }

  @Get('statistics')
  getStatistics(@GetUser() user: AuthenticatedUser) {
    return this.caloriesService.getStatistics(user.userId);
  }

  @Get('search')
  searchFood(@Query('q') query: string) {
    return this.caloriesService.suggestFood(query);
  }
}

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
import type { DietPlan, FoodEntry } from './calories.entity';
import { CaloriesService } from './calories.service';

interface WeightLogDto {
  weight: number;
  date: string;
}

@Controller('calories')
@UseGuards(JwtAuthGuard)
export class CaloriesController {
  constructor(private readonly caloriesService: CaloriesService) {}

  @Post('food')
  logFood(
    @Body() data: Partial<FoodEntry>,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.caloriesService.logFood(data, user.userId);
  }

  @Delete('food/:id')
  deleteFood(@Param('id') id: string, @GetUser() user: AuthenticatedUser) {
    return this.caloriesService.deleteFood(id, user.userId);
  }

  @Post('weight')
  logWeight(@Body() data: WeightLogDto, @GetUser() user: AuthenticatedUser) {
    return this.caloriesService.logWeight(data.weight, data.date, user.userId);
  }

  @Post('plan')
  createDietPlan(
    @Body() data: Partial<DietPlan>,
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

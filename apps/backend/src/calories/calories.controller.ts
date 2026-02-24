import { Controller, Post, Get, Delete, Body, UseGuards, Query, Param, Request } from '@nestjs/common';
import { CaloriesService } from './calories.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('calories')
@UseGuards(AuthGuard('jwt'))
export class CaloriesController {
    constructor(private readonly caloriesService: CaloriesService) { }

    @Post('food')
    logFood(@Body() data: any, @Request() req) {
        return this.caloriesService.logFood(data, req.user.id);
    }

    @Delete('food/:id')
    deleteFood(@Param('id') id: string, @Request() req) {
        return this.caloriesService.deleteFood(id, req.user.id);
    }

    @Post('weight')
    logWeight(@Body() data: { weight: number, date: string }, @Request() req) {
        return this.caloriesService.logWeight(data.weight, data.date, req.user.id);
    }

    @Post('plan')
    createDietPlan(@Body() data: any, @Request() req) {
        return this.caloriesService.createDietPlan(data, req.user.id);
    }

    @Get('plan/:date')
    getPlan(@Param('date') date: string, @Request() req) {
        return this.caloriesService.getDietPlan(date, req.user.id);
    }

    @Get('statistics')
    getStatistics(@Request() req) {
        return this.caloriesService.getStatistics(req.user.id);
    }

    @Get('search')
    searchFood(@Query('q') query: string) {
        return this.caloriesService.suggestFood(query);
    }
}

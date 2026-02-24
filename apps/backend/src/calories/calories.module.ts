import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaloriesService } from './calories.service';
import { CaloriesController } from './calories.controller';
import { FoodEntry, WeightLog, DietPlan, FoodDatabase } from './calories.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([FoodEntry, WeightLog, DietPlan, FoodDatabase]),
    ],
    controllers: [CaloriesController],
    providers: [CaloriesService],
    exports: [CaloriesService],
})
export class CaloriesModule { }

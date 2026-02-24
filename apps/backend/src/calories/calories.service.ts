import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { FoodEntry, WeightLog, DietPlan, FoodDatabase } from './calories.entity';

@Injectable()
export class CaloriesService {
    constructor(
        @InjectRepository(FoodEntry)
        private foodEntryRepository: Repository<FoodEntry>,
        @InjectRepository(WeightLog)
        private weightLogRepository: Repository<WeightLog>,
        @InjectRepository(DietPlan)
        private dietPlanRepository: Repository<DietPlan>,
        @InjectRepository(FoodDatabase)
        private foodDatabaseRepository: Repository<FoodDatabase>,
    ) { }

    async logFood(data: Partial<FoodEntry>, userId: string) {
        // Automatic calculation if nutrition is missing but exists in database
        if (!data.calories && data.name) {
            const suggest = await this.foodDatabaseRepository.findOne({ where: { name: data.name } });
            if (suggest) {
                const ratio = (data.amount || 100) / 100;
                data.calories = suggest.caloriesPer100g * ratio;
                data.protein = suggest.proteinPer100g * ratio;
                data.fat = suggest.fatPer100g * ratio;
                data.carbs = suggest.carbsPer100g * ratio;
            }
        }

        const entry = this.foodEntryRepository.create({ ...data, userId });
        return this.foodEntryRepository.save(entry);
    }

    async logWeight(weight: number, date: string, userId: string) {
        const log = this.weightLogRepository.create({ weight, date, userId });
        return this.weightLogRepository.save(log);
    }

    async createDietPlan(data: Partial<DietPlan>, userId: string) {
        // Deactivate previous active plans
        await this.dietPlanRepository.update({ userId, isActive: true }, { isActive: false });

        const plan = this.dietPlanRepository.create({ ...data, userId, isActive: true });
        return this.dietPlanRepository.save(plan);
    }

    async getDietPlan(date: string, userId: string) {
        return this.dietPlanRepository.findOne({
            where: {
                userId,
                isActive: true,
                startDate: MoreThanOrEqual(date), // Simplification: get active plan
            },
            order: { startDate: 'DESC' }
        }) || this.dietPlanRepository.findOne({ where: { userId, isActive: true } });
    }

    async getStatistics(userId: string) {
        const today = new Date().toISOString().split('T')[0];

        const foodEntries = await this.foodEntryRepository.find({ where: { userId } });
        const weightLogs = await this.weightLogRepository.find({
            where: { userId },
            order: { date: 'ASC' }
        });
        const activePlan = await this.dietPlanRepository.findOne({ where: { userId, isActive: true } });

        // Today's stats
        const todayEntries = foodEntries.filter(e => e.date === today);
        const todayCalories = todayEntries.reduce((sum, e) => sum + e.calories, 0);
        const todayMacros = todayEntries.reduce((acc, e) => {
            acc.protein += e.protein;
            acc.fat += e.fat;
            acc.carbs += e.carbs;
            return acc;
        }, { protein: 0, fat: 0, carbs: 0 });

        return {
            today: {
                calories: todayCalories,
                macros: todayMacros,
                target: activePlan?.targetCalories || 2000,
            },
            weightTrend: weightLogs,
            allEntries: foodEntries,
            activePlan
        };
    }

    async suggestFood(query: string) {
        return this.foodDatabaseRepository.createQueryBuilder('food')
            .where('food.name LIKE :query', { query: `%${query}%` })
            .limit(10)
            .getMany();
    }

    async deleteFood(id: string, userId: string) {
        const entry = await this.foodEntryRepository.findOne({ where: { id, userId } });
        if (!entry) throw new NotFoundException('Food entry not found');
        return this.foodEntryRepository.remove(entry);
    }
}

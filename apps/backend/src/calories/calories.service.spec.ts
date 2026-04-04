import { Repository } from 'typeorm';
import { CaloriesService } from './calories.service';
import {
  DietPlan,
  FoodDatabase,
  FoodEntry,
  WeightLog,
} from './calories.entity';

type MockRepository<T> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('CaloriesService', () => {
  const createService = ({
    dietPlanRepository = {},
    foodDatabaseRepository = {},
  }: {
    dietPlanRepository?: MockRepository<DietPlan>;
    foodDatabaseRepository?: MockRepository<FoodDatabase>;
  }) =>
    new CaloriesService(
      {} as Repository<FoodEntry>,
      {} as Repository<WeightLog>,
      dietPlanRepository as Repository<DietPlan>,
      foodDatabaseRepository as Repository<FoodDatabase>,
    );

  it('falls back to the latest active plan when no future-matching plan exists', async () => {
    const findOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'plan-1', isActive: true });
    const service = createService({
      dietPlanRepository: { findOne },
    });

    const result = await service.getDietPlan('2026-04-04', 'user-1');

    expect(findOne).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ id: 'plan-1', isActive: true });
  });

  it('normalizes the food search query to lowercase for cross-database matching', async () => {
    const where = jest.fn().mockReturnThis();
    const limit = jest.fn().mockReturnThis();
    const getMany = jest.fn().mockResolvedValue([]);
    const createQueryBuilder = jest.fn().mockReturnValue({
      where,
      limit,
      getMany,
    });
    const service = createService({
      foodDatabaseRepository: { createQueryBuilder },
    });

    await service.suggestFood('Chicken');

    expect(where).toHaveBeenCalledWith('LOWER(food.name) LIKE :query', {
      query: '%chicken%',
    });
  });
});

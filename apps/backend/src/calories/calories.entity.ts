import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('food_entries')
export class FoodEntry extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'float' })
  amount: number; // in grams or servings

  @Column({ type: 'float' })
  calories: number;

  @Column({ type: 'float', default: 0 })
  protein: number;

  @Column({ type: 'float', default: 0 })
  fat: number;

  @Column({ type: 'float', default: 0 })
  carbs: number;

  @Column()
  date: string; // YYYY-MM-DD

  @Column({ default: 'meal' })
  mealType: string; // breakfast, lunch, dinner, snack

  @ManyToOne(() => User, (user) => user.foodEntries, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}

@Entity('weight_logs')
export class WeightLog extends BaseEntity {
  @Column({ type: 'float' })
  weight: number;

  @Column()
  date: string; // YYYY-MM-DD

  @ManyToOne(() => User, (user) => user.weightLogs, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}

@Entity('diet_plans')
export class DietPlan extends BaseEntity {
  @Column({ type: 'float' })
  targetCalories: number;

  @Column({ type: 'float', default: 30 })
  proteinRatio: number; // Percentage

  @Column({ type: 'float', default: 30 })
  fatRatio: number; // Percentage

  @Column({ type: 'float', default: 40 })
  carbsRatio: number; // Percentage

  @Column()
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.dietPlans, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;
}

@Entity('food_database')
export class FoodDatabase extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'float' })
  caloriesPer100g: number;

  @Column({ type: 'float', default: 0 })
  proteinPer100g: number;

  @Column({ type: 'float', default: 0 })
  fatPer100g: number;

  @Column({ type: 'float', default: 0 })
  carbsPer100g: number;

  @Column({ nullable: true })
  category: string;
}

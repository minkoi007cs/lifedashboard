import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Task } from '../tasks/task.entity';
import { Habit } from '../habits/habit.entity';
import {
  FinanceSale,
  FinanceExpense,
  PayPeriod,
} from '../finance/finance.entity';
import { FocusSession } from '../focus/focus.entity';
import { FoodEntry, WeightLog, DietPlan } from '../calories/calories.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ nullable: true, select: false })
  password?: string; // Optional for OAuth users

  @Column({ nullable: true })
  googleId?: string;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Habit[];

  @OneToMany(() => FinanceSale, (sale) => sale.user)
  financeSales: FinanceSale[];

  @OneToMany(() => FinanceExpense, (expense) => expense.user)
  financeExpenses: FinanceExpense[];

  @OneToMany(() => PayPeriod, (period) => period.user)
  payPeriods: PayPeriod[];

  @OneToMany(() => FocusSession, (session) => session.user)
  focusSessions: FocusSession[];

  @OneToMany(() => FoodEntry, (entry) => entry.user)
  foodEntries: FoodEntry[];

  @OneToMany(() => WeightLog, (log) => log.user)
  weightLogs: WeightLog[];

  @OneToMany(() => DietPlan, (plan) => plan.user)
  dietPlans: DietPlan[];
}

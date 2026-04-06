import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { Task, TaskParticipant } from '../tasks/task.entity';
import { Habit } from '../habits/habit.entity';
import {
  FinanceSale,
  FinanceExpense,
  PayPeriod,
} from '../finance/finance.entity';
import { FocusSession } from '../focus/focus.entity';
import { FoodEntry, WeightLog, DietPlan } from '../calories/calories.entity';
import {
  WishComment,
  WishEntry,
  WishResponse,
  WishShare,
} from '../wishes/wish.entity';
import { AppNotification } from '../notifications/notification.entity';

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
  password?: string;

  @Column({ nullable: true })
  googleId?: string;

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => TaskParticipant, (participant) => participant.user)
  taskParticipations: TaskParticipant[];

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

  @OneToMany(() => WishEntry, (wish) => wish.owner)
  wishes: WishEntry[];

  @OneToMany(() => WishResponse, (response) => response.responder)
  wishResponses: WishResponse[];

  @OneToMany(() => WishShare, (share) => share.recipient)
  wishShares: WishShare[];

  @OneToMany(() => WishComment, (comment) => comment.author)
  wishComments: WishComment[];

  @OneToMany(() => AppNotification, (notification) => notification.user)
  notifications: AppNotification[];
}

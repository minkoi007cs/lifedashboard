import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('habits')
export class Habit extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  // name: keeps the existing DB column; TS property is now camelCase
  @Column({ name: 'frequency_type', default: 'daily' })
  frequencyType: string;

  @Column({ name: 'frequency_days', type: 'simple-json', nullable: true })
  frequencyDays: number[]; // 0-6 for Sun-Sat

  @Column({ name: 'target_count', default: 1 })
  targetCount: number;

  @Column({ name: 'reminder_time', nullable: true })
  reminderTime: string; // HH:mm

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: string;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @Column({ default: 0 })
  streak: number;

  @Column({ name: 'longest_streak', default: 0 })
  longestStreak: number;

  @ManyToOne(() => User, (user) => user.habits, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => HabitLog, (log) => log.habit)
  logs: HabitLog[];
}

@Entity('habit_logs')
export class HabitLog extends BaseEntity {
  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD

  @Column({ name: 'completed_count', default: 0 })
  completedCount: number;

  @Column({ name: 'is_completed', default: false })
  isCompleted: boolean;

  @ManyToOne(() => Habit, (habit) => habit.logs, { onDelete: 'CASCADE' })
  habit: Habit;

  @Column()
  habitId: string;
}

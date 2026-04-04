import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

@Entity('habits')
export class Habit extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({
    default: 'daily',
  })
  frequency_type: string;

  @Column({ type: 'simple-json', nullable: true })
  frequency_days: number[]; // 0-6 for Sun-Sat

  @Column({ default: 0 })
  target_count: number;

  @Column({ nullable: true })
  reminder_time: string; // HH:mm

  @Column({ type: 'date', nullable: true })
  start_date: string;

  @Column({ default: false })
  is_archived: boolean;

  @Column({ default: 0 })
  streak: number;

  @Column({ default: 0 })
  longest_streak: number;

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

  @Column({ default: 0 })
  completed_count: number;

  @Column({ default: false })
  is_completed: boolean;

  @ManyToOne(() => Habit, (habit) => habit.logs, { onDelete: 'CASCADE' })
  habit: Habit;

  @Column()
  habitId: string;
}

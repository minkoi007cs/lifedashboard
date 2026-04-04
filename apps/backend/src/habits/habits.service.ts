import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit, HabitLog } from './habit.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

@Injectable()
export class HabitsService {
  constructor(
    @InjectRepository(Habit)
    private habitsRepository: Repository<Habit>,
    @InjectRepository(HabitLog)
    private logsRepository: Repository<HabitLog>,
  ) {}

  async findAll(userId: string): Promise<Habit[]> {
    return this.habitsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['logs'],
    });
  }

  async findOne(id: string, userId: string): Promise<Habit> {
    const habit = await this.habitsRepository.findOne({
      where: { id, userId },
      relations: ['logs'],
    });
    if (!habit) {
      throw new NotFoundException(`Habit with ID "${id}" not found`);
    }
    return habit;
  }

  async create(createHabitDto: CreateHabitDto, userId: string): Promise<Habit> {
    const habit = this.habitsRepository.create({
      ...createHabitDto,
      userId,
      start_date: createHabitDto.start_date || format(new Date(), 'yyyy-MM-dd'),
    });
    return this.habitsRepository.save(habit);
  }

  async update(
    id: string,
    updateHabitDto: UpdateHabitDto,
    userId: string,
  ): Promise<Habit> {
    const habit = await this.findOne(id, userId);
    Object.assign(habit, updateHabitDto);
    return this.habitsRepository.save(habit);
  }

  async logHabit(
    habitId: string,
    userId: string,
    date: string,
    count: number = 1,
  ): Promise<HabitLog> {
    const habit = await this.findOne(habitId, userId);

    let log = await this.logsRepository.findOne({
      where: { habitId, date },
    });

    if (log) {
      log.completed_count += count;
    } else {
      log = this.logsRepository.create({
        habitId,
        date,
        completed_count: count,
      });
    }

    log.is_completed = log.completed_count >= habit.target_count;
    await this.logsRepository.save(log);

    await this.updateStreaks(habit);

    return log;
  }

  private async updateStreaks(habit: Habit): Promise<void> {
    const logs = await this.logsRepository.find({
      where: { habitId: habit.id, is_completed: true },
      order: { date: 'DESC' },
    });

    if (logs.length === 0) {
      habit.streak = 0;
      await this.habitsRepository.save(habit);
      return;
    }

    let currentStreak = 0;
    const longestStreak = habit.longest_streak;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

    // Check if latest log is today or yesterday
    const latestLogDate = logs[0].date;
    if (latestLogDate !== todayStr && latestLogDate !== yesterdayStr) {
      habit.streak = 0;
    } else {
      currentStreak = 1;
      for (let i = 0; i < logs.length - 1; i++) {
        const currentLogDate = new Date(logs[i].date);
        const nextLogDate = new Date(logs[i + 1].date);
        const diffDays = Math.round(
          (currentLogDate.getTime() - nextLogDate.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
      habit.streak = currentStreak;
    }

    if (habit.streak > longestStreak) {
      habit.longest_streak = habit.streak;
    }

    await this.habitsRepository.save(habit);
  }

  async getStatistics(userId: string) {
    const habits = await this.habitsRepository.find({
      where: { userId },
      relations: ['logs'],
    });

    const totalCompletions = habits.reduce(
      (acc, h) => acc + h.logs.filter((l) => l.is_completed).length,
      0,
    );

    // Weekly summary (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    }).map((date) => format(date, 'yyyy-MM-dd'));

    const weeklySummary = last7Days.map((date) => {
      const completed = habits.reduce((acc, h) => {
        const log = h.logs.find((l) => l.date === date && l.is_completed);
        return acc + (log ? 1 : 0);
      }, 0);
      return { date, completed, target: habits.length };
    });

    // Monthly heatmap (current month)
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    const monthDays = eachDayOfInterval({ start, end }).map((date) =>
      format(date, 'yyyy-MM-dd'),
    );

    const monthlyHeatmap = monthDays.map((date) => {
      const count = habits.reduce((acc, h) => {
        const log = h.logs.find((l) => l.date === date && l.is_completed);
        return acc + (log ? 1 : 0);
      }, 0);
      return { date, count };
    });

    return {
      totalCompletions,
      weeklySummary,
      monthlyHeatmap,
      activeHabits: habits.filter((h) => !h.is_archived).length,
      archivedHabits: habits.filter((h) => h.is_archived).length,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.habitsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Habit with ID "${id}" not found`);
    }
  }
}

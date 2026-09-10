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
      startDate: createHabitDto.startDate || format(new Date(), 'yyyy-MM-dd'),
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
      log.completedCount += count;
    } else {
      log = this.logsRepository.create({
        habitId,
        date,
        completedCount: count,
      });
    }

    log.isCompleted = log.completedCount >= habit.targetCount;
    await this.logsRepository.save(log);

    await this.updateStreaks(habit);

    return log;
  }

  private async updateStreaks(habit: Habit): Promise<void> {
    const logs = await this.logsRepository.find({
      where: { habitId: habit.id, isCompleted: true },
      order: { date: 'DESC' },
    });

    if (logs.length === 0) {
      habit.streak = 0;
      await this.habitsRepository.save(habit);
      return;
    }

    const completedDates = new Set(logs.map((l) => l.date));
    const targetDays =
      habit.frequencyDays && habit.frequencyDays.length > 0
        ? new Set(habit.frequencyDays)
        : null; // null means every day (0-6) is expected

    const isExpectedDay = (d: Date): boolean => {
      if (!targetDays) return true;
      return targetDays.has(d.getDay());
    };

    let currentStreak = 0;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // 1. Check if today was completed
    let checkDate: Date;
    if (completedDates.has(todayStr)) {
      currentStreak++;
      checkDate = subDays(today, 1);
    } else if (isExpectedDay(today)) {
      // Expected today, but not completed yet: grace period, start checking from yesterday
      checkDate = subDays(today, 1);
    } else {
      // Today is a rest day: start checking from yesterday
      checkDate = subDays(today, 1);
    }

    // 2. Walk backwards day by day (up to 365 days)
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');

      // If habit has a startDate and we've reached before it, stop
      if (habit.startDate && dateStr < habit.startDate) {
        break;
      }

      if (isExpectedDay(checkDate)) {
        if (completedDates.has(dateStr)) {
          currentStreak++;
        } else {
          // An expected day was missed, streak ends here
          break;
        }
      }
      // If it's not an expected day (rest day), continue walking backwards without breaking streak

      checkDate = subDays(checkDate, 1);
    }

    habit.streak = currentStreak;
    if (habit.streak > habit.longestStreak) {
      habit.longestStreak = habit.streak;
    }

    await this.habitsRepository.save(habit);
  }

  async getStatistics(userId: string) {
    const habits = await this.habitsRepository.find({
      where: { userId },
      relations: ['logs'],
    });

    const totalCompletions = habits.reduce(
      (acc, h) => acc + h.logs.filter((l) => l.isCompleted).length,
      0,
    );

    // Weekly summary (last 7 days)
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    }).map((date) => format(date, 'yyyy-MM-dd'));

    const weeklySummary = last7Days.map((date) => {
      const completed = habits.reduce((acc, h) => {
        const log = h.logs.find((l) => l.date === date && l.isCompleted);
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
        const log = h.logs.find((l) => l.date === date && l.isCompleted);
        return acc + (log ? 1 : 0);
      }, 0);
      return { date, count };
    });

    return {
      totalCompletions,
      weeklySummary,
      monthlyHeatmap,
      activeHabits: habits.filter((h) => !h.isArchived).length,
      archivedHabits: habits.filter((h) => h.isArchived).length,
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.habitsRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Habit with ID "${id}" not found`);
    }
  }
}

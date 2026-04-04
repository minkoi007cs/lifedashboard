import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async findAll(userId: string): Promise<Task[]> {
    return this.tasksRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { id, userId } });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  async create(createTaskDto: Partial<Task>, userId: string): Promise<Task> {
    const task = this.tasksRepository.create({ ...createTaskDto, userId });
    return this.tasksRepository.save(task);
  }

  async update(
    id: string,
    updateTaskDto: Partial<Task>,
    userId: string,
  ): Promise<Task> {
    const task = await this.findOne(id, userId); // Ensure ownership
    Object.assign(task, updateTaskDto);
    return this.tasksRepository.save(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    const result = await this.tasksRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
  }

  async findWeek(startDate: Date, userId: string): Promise<Task[]> {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return this.tasksRepository.find({
      where: {
        userId,
        dueDate: Between(start, end),
      },
      order: { dueDate: 'ASC' },
    });
  }

  async findMonth(monthStr: string, userId: string): Promise<Task[]> {
    // monthStr format: YYYY-MM
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return this.tasksRepository.find({
      where: {
        userId,
        dueDate: Between(start, end),
      },
      order: { dueDate: 'ASC' },
    });
  }

  async getStatistics(userId: string) {
    const tasks = await this.findAll(userId);

    const statusStats = {
      done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      pending: tasks.filter((t) => t.status !== TaskStatus.DONE).length,
    };

    const priorityStats = {
      low: tasks.filter((t) => t.priority === TaskPriority.LOW).length,
      medium: tasks.filter((t) => t.priority === TaskPriority.MEDIUM).length,
      high: tasks.filter((t) => t.priority === TaskPriority.HIGH).length,
    };

    // Simplified weekly progress (last 4 weeks)
    // In a real app, this would be more complex, but for now we aggregate by week
    return {
      statusStats,
      priorityStats,
      total: tasks.length,
    };
  }
}

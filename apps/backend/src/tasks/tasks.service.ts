import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Task, TaskParticipant, TaskPriority, TaskStatus } from './task.entity';
import { UsersService } from '../users/users.service';

type TaskWriteInput = Partial<Task> & {
  participantIds?: string[];
};

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskParticipant)
    private taskParticipantsRepository: Repository<TaskParticipant>,
    private usersService: UsersService,
  ) {}

  async findAll(userId: string): Promise<Task[]> {
    return this.createVisibleTasksQuery(userId)
      .orderBy('task.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.createVisibleTasksQuery(userId)
      .andWhere('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return task;
  }

  async create(createTaskDto: TaskWriteInput, userId: string): Promise<Task> {
    return this.createTaskRecord(
      createTaskDto,
      userId,
      createTaskDto.participantIds ?? [],
    );
  }

  async update(
    id: string,
    updateTaskDto: TaskWriteInput,
    userId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id, userId },
      relations: ['participants'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    Object.assign(task, updateTaskDto);
    await this.tasksRepository.save(task);

    if (updateTaskDto.participantIds) {
      await this.replaceParticipants(task.id, updateTaskDto.participantIds);
    }

    return this.findOne(id, userId);
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

    return this.createVisibleTasksQuery(userId)
      .andWhere('task.dueDate BETWEEN :start AND :end', { start, end })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
  }

  async findMonth(monthStr: string, userId: string): Promise<Task[]> {
    const [year, month] = monthStr.split('-').map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    return this.createVisibleTasksQuery(userId)
      .andWhere('task.dueDate BETWEEN :start AND :end', { start, end })
      .orderBy('task.dueDate', 'ASC')
      .getMany();
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

    return {
      statusStats,
      priorityStats,
      total: tasks.length,
    };
  }

  async createSharedPlanFromWish(
    data: TaskWriteInput,
    ownerId: string,
    participantIds: string[],
  ) {
    return this.createTaskRecord(
      {
        ...data,
        isSharedPlan: true,
        participantIds,
      },
      ownerId,
      participantIds,
    );
  }

  private createVisibleTasksQuery(userId: string) {
    return this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'participantUser')
      .where(
        new Brackets((qb) => {
          qb.where('task.userId = :userId', { userId }).orWhere(
            'participant.userId = :userId',
            { userId },
          );
        }),
      )
      .distinct(true);
  }

  private async createTaskRecord(
    createTaskDto: TaskWriteInput,
    userId: string,
    participantIds: string[],
  ) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      userId,
    });
    const savedTask = await this.tasksRepository.save(task);
    await this.replaceParticipants(savedTask.id, participantIds);
    return this.findOne(savedTask.id, userId);
  }

  private async replaceParticipants(taskId: string, participantIds: string[]) {
    const uniqueParticipantIds = [...new Set(participantIds)];
    await this.taskParticipantsRepository.delete({ taskId });

    for (const participantId of uniqueParticipantIds) {
      const participantUser = await this.usersService.findById(participantId);
      if (!participantUser) {
        throw new NotFoundException(
          `User with ID "${participantId}" not found`,
        );
      }

      const participant = this.taskParticipantsRepository.create({
        taskId,
        userId: participantId,
      });
      await this.taskParticipantsRepository.save(participant);
    }
  }
}

import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { User } from '../users/user.entity';

export enum TaskStatus {
  TODO = 'TODO',
  DOING = 'DOING',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('tasks')
export class Task extends BaseEntity {
  @Column()
  title: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar', default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ nullable: true })
  reminderTime: Date;

    @Column({ nullable: true })
    startDate?: Date;

    @Column({ nullable: true })
    endDate?: Date;

  @Column({ default: false })
  isSharedPlan: boolean;

    @Column({ nullable: true })
    sourceWishId?: string;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => TaskParticipant, (participant) => participant.task, {
    cascade: true,
  })
  participants: TaskParticipant[];
}

@Entity('task_participants')
export class TaskParticipant extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.participants, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User, (user) => user.taskParticipations, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column()
  userId: string;
}

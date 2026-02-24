import { Entity, Column, ManyToOne } from 'typeorm';
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

    // Using varchar instead of enum for SQLite compatibility
    @Column({ default: TaskStatus.TODO })
    status: string;

    @Column({ default: TaskPriority.MEDIUM })
    priority: string;

    @Column({ nullable: true })
    dueDate: Date;

    @Column({ nullable: true })
    reminderTime: Date;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    user: User;

    @Column()
    userId: string;
}

export type TaskStatus = 'TODO' | 'DOING' | 'DONE';

export const TaskStatus = {
    TODO: 'TODO' as TaskStatus,
    DOING: 'DOING' as TaskStatus,
    DONE: 'DONE' as TaskStatus,
};

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export const TaskPriority = {
    LOW: 'LOW' as TaskPriority,
    MEDIUM: 'MEDIUM' as TaskPriority,
    HIGH: 'HIGH' as TaskPriority,
};

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    reminderTime?: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskStats {
    statusStats: {
        done: number;
        pending: number;
    };
    priorityStats: {
        low: number;
        medium: number;
        high: number;
    };
    total: number;
}

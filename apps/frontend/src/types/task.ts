export type { Task, TaskParticipant, TaskStats } from '@life-dashboard/shared';

// Declared locally so const objects can coexist with the type (declaration merging).
// Values match '@life-dashboard/shared' TaskStatus / TaskPriority exactly.
export type TaskStatus = 'TODO' | 'DOING' | 'DONE';
export const TaskStatus = {
    TODO: 'TODO' as const,
    DOING: 'DOING' as const,
    DONE: 'DONE' as const,
};

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export const TaskPriority = {
    LOW: 'LOW' as const,
    MEDIUM: 'MEDIUM' as const,
    HIGH: 'HIGH' as const,
};

export type FrequencyType = 'daily' | 'weekly';

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completedCount: number;
    isCompleted: boolean;
    createdAt: string;
}

export interface Habit {
    id: string;
    userId: string;
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyDays: number[];
    targetCount: number;
    reminderTime?: string;
    startDate: string;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    streak: number;
    longestStreak: number;
    completionRate: number;
    totalCompletions: number;
    lastCompletedDate?: string;
    logs?: HabitLog[];
}

export interface HabitStatistics {
    totalCompletions: number;
    activeHabits: number;
    archivedHabits: number;
    weeklySummary: {
        date: string;
        completed: number;
        target: number;
    }[];
    monthlyHeatmap: {
        date: string;
        count: number;
    }[];
}

export interface CreateHabitDto {
    name: string;
    description?: string;
    frequency_type: FrequencyType;
    target_count?: number;
    reminder_time?: string;
}

export interface UpdateHabitDto extends Partial<CreateHabitDto> {
    isArchived?: boolean;
}

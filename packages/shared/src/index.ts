export const APP_NAME = "Life Dashboard";

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
}

export enum FrequencyType {
    DAILY = 'daily',
    WEEKLY = 'weekly'
}

export interface Habit {
    id: string;
    userId: string;
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyDays: number[]; // 0-6 for Sun-Sat
    targetCount: number;
    reminderTime?: string; // HH:mm
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

export interface HabitLog {
    id: string;
    habitId: string;
    date: string;
    completedCount: number;
    isCompleted: boolean;
    createdAt: string;
}

export interface CreateHabitDto {
    name: string;
    description?: string;
    frequencyType: FrequencyType;
    frequencyDays?: number[];
    targetCount?: number;
    reminderTime?: string;
    startDate?: string;
}

export interface UpdateHabitDto extends Partial<CreateHabitDto> {
    isArchived?: boolean;
}

export interface HabitStatistics {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate: number;
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

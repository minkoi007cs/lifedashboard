import api from '../lib/axios';
import type { Habit, HabitLog, HabitStatistics, CreateHabitPayload, UpdateHabitPayload } from '@life-dashboard/shared';

export const habitService = {
    getAll: async () => {
        const response = await api.get<Habit[]>('/api/v1/habits');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Habit>(`/api/v1/habits/${id}`);
        return response.data;
    },

    getStatistics: async () => {
        const response = await api.get<HabitStatistics>('/api/v1/habits/statistics');
        return response.data;
    },

    create: async (data: CreateHabitPayload) => {
        const response = await api.post<Habit>('/api/v1/habits', data);
        return response.data;
    },

    update: async (id: string, data: UpdateHabitPayload) => {
        const response = await api.put<Habit>(`/api/v1/habits/${id}`, data);
        return response.data;
    },

    log: async (id: string, date: string, count: number = 1) => {
        const response = await api.post<HabitLog>(`/api/v1/habits/${id}/log`, { date, count });
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/api/v1/habits/${id}`);
    }
};

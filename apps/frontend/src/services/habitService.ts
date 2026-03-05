import api from '../lib/axios';
import type { Habit, HabitLog, HabitStatistics, CreateHabitDto, UpdateHabitDto } from '../types/habit';

export const habitService = {
    getAll: async () => {
        const response = await api.get<Habit[]>('/habits');
        return response.data;
    },

    getById: async (id: string) => {
        const response = await api.get<Habit>(`/habits/${id}`);
        return response.data;
    },

    getStatistics: async () => {
        const response = await api.get<HabitStatistics>('/habits/statistics');
        return response.data;
    },

    create: async (data: CreateHabitDto) => {
        const response = await api.post<Habit>('/habits', data);
        return response.data;
    },

    update: async (id: string, data: UpdateHabitDto) => {
        const response = await api.put<Habit>(`/habits/${id}`, data);
        return response.data;
    },

    log: async (id: string, date: string, count: number = 1) => {
        const response = await api.post<HabitLog>(`/habits/${id}/log`, { date, count });
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/habits/${id}`);
    }
};

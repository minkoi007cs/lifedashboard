import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Flame, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';

interface Habit {
    id: string;
    title: string;
    streak: number;
    logs: { date: string }[];
}

export const HabitsWidget: React.FC = () => {
    const queryClient = useQueryClient();
    const today = format(new Date(), 'yyyy-MM-dd');

    const { data: habits, isLoading } = useQuery<Habit[]>({
        queryKey: ['habits'],
        queryFn: async () => {
            const res = await api.get('/api/v1/habits');
            return res.data;
        },
    });

    const logHabitMutation = useMutation({
        mutationFn: (id: string) => api.post(`/api/v1/habits/${id}/log`, { date: today }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
    });

    const createHabitMutation = useMutation({
        mutationFn: (title: string) => api.post('/api/v1/habits', { title }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['habits'] }),
    });

    const handleCreate = () => {
        const title = prompt("Enter habit name:");
        if (title) createHabitMutation.mutate(title);
    }

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Habits</h2>
                <button onClick={handleCreate} className="text-primary hover:bg-gray-100 p-1 rounded"><Plus className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1">
                {habits?.map((habit) => {
                    const isDoneToday = habit.logs.some(log => log.date === today);
                    return (
                        <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-gray-100">{habit.title}</span>
                                <span className="text-xs text-gray-500 flex items-center">
                                    <Flame className="w-3 h-3 mr-1 text-orange-500 fill-orange-500" />
                                    {habit.streak} day streak
                                </span>
                            </div>
                            <button
                                onClick={() => !isDoneToday && logHabitMutation.mutate(habit.id)}
                                disabled={isDoneToday || logHabitMutation.isPending}
                                className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                    isDoneToday
                                        ? "bg-green-500 text-white cursor-default"
                                        : "bg-gray-200 dark:bg-gray-600 hover:bg-green-200 text-transparent hover:text-green-600"
                                )}
                            >
                                <Plus className={clsx("w-5 h-5", isDoneToday && "hidden")} />
                                {isDoneToday && <span className="text-xs font-bold">✓</span>}
                            </button>
                        </div>
                    );
                })}
                {habits?.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No habits defined.</p>}
            </div>
        </div>
    );
};

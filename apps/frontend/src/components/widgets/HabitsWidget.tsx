import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Flame, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { WidgetFrame } from '../ui/shell';

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

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    return (
        <WidgetFrame
            title="Habits"
            icon={<Flame className="h-5 w-5" />}
            meta="Keep the streak alive"
            accent="from-amber-400 via-orange-500 to-pink-500"
            footer={
                <button onClick={handleCreate} className="inline-flex items-center rounded-2xl bg-orange-50/80 px-4 py-3 text-sm font-semibold text-pink-600 dark:bg-slate-800/90 dark:text-pink-300">
                    <Plus className="mr-2 h-4 w-4" /> New Habit
                </button>
            }
        >

            <div className="space-y-3 overflow-y-auto flex-1">
                {habits?.map((habit) => {
                    const isDoneToday = habit.logs.some(log => log.date === today);
                    return (
                        <div key={habit.id} className="flex items-center justify-between rounded-2xl border border-orange-100/70 bg-orange-50/70 p-3 dark:border-white/10 dark:bg-slate-800/80">
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
        </WidgetFrame>
    );
};

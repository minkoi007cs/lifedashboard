import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import type { Task } from '../../types/task.ts';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Loader2, Clock } from 'lucide-react';
import clsx from 'clsx';

interface WeeklySchedulerProps {
    startDate: Date;
}

export const WeeklyScheduler: React.FC<WeeklySchedulerProps> = ({ startDate }) => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ['tasks', 'week', format(weekStart, 'yyyy-MM-dd')],
        queryFn: async () => {
            const res = await api.get(`/api/v1/tasks/week/${format(weekStart, 'yyyy-MM-dd')}`);
            return res.data;
        },
    });

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const getTasksForSlot = (day: Date, hour: number) => {
        return tasks?.filter(task => {
            const taskDate = new Date(task.dueDate);
            return isSameDay(taskDate, day) && taskDate.getHours() === hour;
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                    {/* Header */}
                    <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 dark:border-gray-700">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50"></div>
                        {days.map((day) => (
                            <div key={day.toISOString()} className={clsx(
                                "p-4 text-center border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50",
                                isSameDay(day, new Date()) && "bg-primary/5 dark:bg-primary/10"
                            )}>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{format(day, 'EEE')}</div>
                                <div className={clsx(
                                    "text-lg font-bold mt-1",
                                    isSameDay(day, new Date()) ? "text-primary" : "text-gray-900 dark:text-white"
                                )}>
                                    {format(day, 'd')}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div className="max-h-[600px] overflow-y-auto">
                        {hours.map((hour) => (
                            <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-100 dark:border-gray-800 last:border-0 h-20">
                                <div className="p-2 text-xs text-gray-400 text-right pr-4 font-medium sticky left-0 bg-white dark:bg-gray-800">
                                    {format(new Date().setHours(hour, 0), 'h a')}
                                </div>
                                {days.map((day) => {
                                    const slotTasks = getTasksForSlot(day, hour);
                                    return (
                                        <div key={day.toISOString()} className="border-l border-gray-100 dark:border-gray-800 p-1 relative hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                            {slotTasks?.map(task => (
                                                <div
                                                    key={task.id}
                                                    className={clsx(
                                                        "p-2 rounded-lg text-xs font-medium mb-1 shadow-sm border-l-4 truncate",
                                                        task.priority === 'HIGH' ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-500" :
                                                            task.priority === 'MEDIUM' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-500" :
                                                                "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-500",
                                                        task.status === 'DONE' && "opacity-50 line-through grayscale"
                                                    )}
                                                >
                                                    <div className="flex items-center">
                                                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                                        {format(new Date(task.dueDate), 'HH:mm')}
                                                    </div>
                                                    <div className="mt-1 truncate">{task.title}</div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

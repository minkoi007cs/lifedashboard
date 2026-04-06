import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import type { Task } from '../../types/task.ts';
import { format } from 'date-fns';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';
import clsx from 'clsx';
import { SurfaceCard } from '../ui/shell';

interface MonthlyListProps {
    month: Date;
}

export const MonthlyList: React.FC<MonthlyListProps> = ({ month }) => {
    const monthStr = format(month, 'yyyy-MM');

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ['tasks', 'month', monthStr],
        queryFn: async () => {
            const res = await api.get(`/api/v1/tasks/month/${monthStr}`);
            return res.data;
        },
    });

    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

    // Group tasks by day
    const groupedTasks = tasks?.reduce((acc, task) => {
        const date = format(new Date(task.dueDate), 'yyyy-MM-dd');
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
    }, {} as Record<string, Task[]>);

    const sortedDates = Object.keys(groupedTasks || {}).sort();

    return (
        <div className="space-y-6">
            {sortedDates.length === 0 ? (
                <SurfaceCard className="border-dashed p-12 text-center">
                    <p className="text-gray-500">No tasks scheduled for this month.</p>
                </SurfaceCard>
            ) : (
                sortedDates.map((date) => (
                    <SurfaceCard key={date} className="overflow-hidden p-0">
                        <div className="flex items-center justify-between border-b border-gray-200 bg-orange-50/70 px-6 py-3 dark:border-gray-700 dark:bg-slate-800/70">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                                {format(new Date(date), 'EEEE, MMMM do')}
                            </h3>
                            <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                                {groupedTasks?.[date].length} Tasks
                            </span>
                        </div>
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {groupedTasks?.[date].map((task) => (
                                <div key={task.id} className="group flex items-center justify-between p-4 transition-colors hover:bg-orange-50/60 dark:hover:bg-slate-800/60">
                                    <div className="flex items-center space-x-4">
                                        <div className={clsx(
                                            "p-1 rounded-full",
                                            task.status === 'DONE' ? "text-green-500" : "text-gray-400"
                                        )}>
                                            {task.status === 'DONE' ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h4 className={clsx(
                                                "text-sm font-semibold",
                                                task.status === 'DONE' ? "text-gray-400 line-through" : "text-gray-900 dark:text-white"
                                            )}>
                                                {task.title}
                                            </h4>
                                            {task.isSharedPlan ? (
                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-pink-500 dark:text-pink-300">
                                                    Shared plan
                                                </p>
                                            ) : null}
                                            {task.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-xs font-medium text-gray-400">
                                            {format(new Date(task.dueDate), 'HH:mm')}
                                        </div>
                                        <div className={clsx(
                                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                            task.priority === 'HIGH' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                                                task.priority === 'MEDIUM' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                                                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                        )}>
                                            {task.priority}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SurfaceCard>
                ))
            )}
        </div>
    );
};

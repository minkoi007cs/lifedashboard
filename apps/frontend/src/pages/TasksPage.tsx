import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Calendar, List, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { TaskStats } from '../types/task';
import { TaskForm } from '../components/tasks/TaskForm';
import { WeeklyScheduler } from '../components/tasks/WeeklyScheduler.tsx';
import { MonthlyList } from '../components/tasks/MonthlyList.tsx';
import { TaskStats as TaskStatsView } from '../components/tasks/TaskStats.tsx';
import clsx from 'clsx';

export const TasksPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'weekly' | 'monthly' | 'stats'>('weekly');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const showNotification = (title: string, body: string) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body });
        }
    };

    const { data: stats, isLoading: statsLoading } = useQuery<TaskStats>({
        queryKey: ['tasks', 'stats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/tasks/statistics');
            return res.data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/tasks', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsFormOpen(false);
            showNotification('Task Created', `"${res.data.title}" has been added to your list.`);
        },
    });

    const handleCreateTask = (data: any) => {
        createTaskMutation.mutate(data);
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        if (view === 'weekly') {
            newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        } else {
            newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        }
        setCurrentDate(newDate);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>

                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setView('weekly')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'weekly' ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <Calendar className="w-4 h-4 mr-2" /> Weekly
                    </button>
                    <button
                        onClick={() => setView('monthly')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'monthly' ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <List className="w-4 h-4 mr-2" /> Monthly
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'stats' ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <BarChart2 className="w-4 h-4 mr-2" /> Stats
                    </button>
                </div>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center justify-center px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg shadow-primary/25 transition-all"
                >
                    <Plus className="w-5 h-5 mr-2" /> New Task
                </button>
            </div>

            {view !== 'stats' && (
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                            {view === 'weekly' ? (
                                `Week of ${currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
                            ) : (
                                currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                            )}
                        </h2>
                        <button onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="text-sm text-primary hover:underline"
                    >
                        Today
                    </button>
                </div>
            )}

            <div className="min-h-[600px]">
                {view === 'weekly' && <WeeklyScheduler startDate={currentDate} />}
                {view === 'monthly' && <MonthlyList month={currentDate} />}
                {view === 'stats' && <TaskStatsView stats={stats} isLoading={statsLoading} />}
            </div>

            {isFormOpen && (
                <TaskForm
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleCreateTask}
                />
            )}
        </div>
    );
};

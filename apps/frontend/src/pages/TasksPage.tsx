import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { Plus, Calendar, List, BarChart2, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import type { Task, TaskStats } from '../types/task';
import { TaskForm } from '../components/tasks/TaskForm';
import { WeeklyScheduler } from '../components/tasks/WeeklyScheduler.tsx';
import { MonthlyList } from '../components/tasks/MonthlyList.tsx';
import { TaskStats as TaskStatsView } from '../components/tasks/TaskStats.tsx';
import { ActionButton, PageHeader, SegmentedTabs, SoftButton, SurfaceCard } from '../components/ui/shell';

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

    type TaskFormValues = Pick<Task, 'title' | 'description' | 'priority' | 'status' | 'dueDate' | 'reminderTime'>;

    const createTaskMutation = useMutation({
        mutationFn: (data: TaskFormValues) => api.post('/api/v1/tasks', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setIsFormOpen(false);
            showNotification('Task Created', `"${res.data.title}" has been added to your list.`);
        },
    });

    const handleCreateTask = (data: TaskFormValues) => {
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
            <PageHeader
                eyebrow="Execution"
                title="Tasks"
                description="Plan weekly priorities, browse monthly commitments and keep momentum visible across devices."
                icon={<CheckSquare className="h-6 w-6" />}
                actions={
                    <>
                        <SegmentedTabs
                            value={view}
                            onChange={setView}
                            tabs={[
                                { id: 'weekly', icon: Calendar, label: 'Weekly' },
                                { id: 'monthly', icon: List, label: 'Monthly' },
                                { id: 'stats', icon: BarChart2, label: 'Stats' },
                            ]}
                            className="xl:w-auto"
                        />
                        <ActionButton onClick={() => setIsFormOpen(true)}>
                            <Plus className="mr-2 h-5 w-5" /> New Task
                        </ActionButton>
                    </>
                }
            />

            {view !== 'stats' && (
                <SurfaceCard className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4">
                        <SoftButton onClick={() => navigateDate('prev')} className="h-11 w-11 rounded-full px-0">
                            <ChevronLeft className="w-6 h-6" />
                        </SoftButton>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 md:text-xl">
                            {view === 'weekly' ? (
                                `Week of ${currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
                            ) : (
                                currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                            )}
                        </h2>
                        <SoftButton onClick={() => navigateDate('next')} className="h-11 w-11 rounded-full px-0">
                            <ChevronRight className="w-6 h-6" />
                        </SoftButton>
                    </div>
                    <SoftButton
                        onClick={() => setCurrentDate(new Date())}
                        className="self-start md:self-auto"
                    >
                        Today
                    </SoftButton>
                </SurfaceCard>
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

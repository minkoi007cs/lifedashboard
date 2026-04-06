import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { habitService } from '../services/habitService';
import { Plus, Zap, BarChart2, Calendar as CalendarIcon } from 'lucide-react';
import { HabitList } from '../components/habits/HabitList';
import { HabitModal } from '../components/habits/HabitModal';
import { HabitHeatmap } from '../components/habits/HabitHeatmap';
import { HabitCharts } from '../components/habits/HabitCharts';
import clsx from 'clsx';
import type { Habit } from '../types/habit';
import { ActionButton, PageHeader, SegmentedTabs, SurfaceCard } from '../components/ui/shell';

export const HabitsPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [view, setView] = useState<'daily' | 'stats' | 'heatmap'>('daily');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

    const { data: habits, isLoading: habitsLoading } = useQuery({
        queryKey: ['habits'],
        queryFn: habitService.getAll,
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['habits', 'stats'],
        queryFn: habitService.getStatistics,
    });



    const handleCreateHabit = () => {
        setEditingHabit(null);
        setIsModalOpen(true);
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Consistency"
                title="Habit Tracker"
                description="Keep daily habits visible, understand trends and make streaks feel rewarding across screen sizes."
                icon={<Zap className="h-6 w-6" />}
                actions={
                    <>
                        <SegmentedTabs
                            value={view}
                            onChange={setView}
                            tabs={[
                                { id: 'daily', icon: Zap, label: 'Daily' },
                                { id: 'heatmap', icon: CalendarIcon, label: 'Heatmap' },
                                { id: 'stats', icon: BarChart2, label: 'Analysis' },
                            ]}
                            className="xl:w-auto"
                        />
                        <ActionButton onClick={handleCreateHabit}>
                            <Plus className="mr-2 h-5 w-5" /> New Habit
                        </ActionButton>
                    </>
                }
            />

            {/* Quick Stats Overview */}
            {stats && view === 'daily' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <SurfaceCard className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Completions</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompletions}</p>
                    </SurfaceCard>
                    <SurfaceCard className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Habits</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeHabits}</p>
                    </SurfaceCard>
                    <SurfaceCard className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Weekly Progress</p>
                        <div className="flex items-end space-x-1 h-8 mt-1">
                            {stats.weeklySummary.map((day, i) => (
                                <div
                                    key={i}
                                    className={clsx(
                                        "w-full rounded-t-sm transition-all",
                                        day.completed > 0 ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                                    )}
                                    style={{ height: `${(day.completed / (day.target || 1)) * 100}%`, minHeight: '4px' }}
                                />
                            ))}
                        </div>
                    </SurfaceCard>
                    <SurfaceCard className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Completion rate</p>
                        <p className="text-2xl font-bold text-green-500">84%</p>
                    </SurfaceCard>
                </div>
            )}

            <div className="min-h-[500px]">
                {view === 'daily' && (
                    <HabitList
                        habits={habits || []}
                        isLoading={habitsLoading}
                        onEdit={handleEditHabit}
                    />
                )}
                {view === 'heatmap' && (
                    <HabitHeatmap data={stats?.monthlyHeatmap || []} isLoading={statsLoading} />
                )}
                {view === 'stats' && (
                    <HabitCharts habits={habits || []} stats={stats} isLoading={statsLoading} />
                )}
            </div>

            {isModalOpen && (
                <HabitModal
                    habit={editingHabit}
                    onClose={() => {
                        setIsModalOpen(false);
                        queryClient.invalidateQueries({ queryKey: ['habits'] });
                    }}
                />
            )}
        </div>
    );
};

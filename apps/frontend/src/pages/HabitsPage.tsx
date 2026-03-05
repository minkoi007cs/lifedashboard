import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { habitService } from '../services/habitService';
import { Plus, Zap, BarChart2, Calendar as CalendarIcon, Archive } from 'lucide-react';
import { HabitList } from '../components/habits/HabitList';
import { HabitModal } from '../components/habits/HabitModal';
import { HabitHeatmap } from '../components/habits/HabitHeatmap';
import { HabitCharts } from '../components/habits/HabitCharts';
import clsx from 'clsx';
import type { Habit } from '../types/habit';

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habit Tracker</h1>
                    <p className="text-gray-500 dark:text-gray-400">Build consistency, master your life.</p>
                </div>

                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setView('daily')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'daily' ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <Zap className="w-4 h-4 mr-2" /> Daily
                    </button>
                    <button
                        onClick={() => setView('heatmap')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'heatmap' ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <CalendarIcon className="w-4 h-4 mr-2" /> Heatmap
                    </button>
                    <button
                        onClick={() => setView('stats')}
                        className={clsx(
                            "flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all",
                            view === 'stats' ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        )}
                    >
                        <BarChart2 className="w-4 h-4 mr-2" /> Analysis
                    </button>
                </div>

                <button
                    onClick={handleCreateHabit}
                    className="flex items-center justify-center px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold shadow-lg shadow-primary/25 transition-all transform hover:scale-105 active:scale-95"
                >
                    <Plus className="w-5 h-5 mr-2" /> New Habit
                </button>
            </div>

            {/* Quick Stats Overview */}
            {stats && view === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Completions</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompletions}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Active Habits</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeHabits}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
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
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Completion rate</p>
                        <p className="text-2xl font-bold text-green-500">84%</p>
                    </div>
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

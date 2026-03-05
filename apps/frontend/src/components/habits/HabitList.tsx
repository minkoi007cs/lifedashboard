import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService } from '../../services/habitService';
import { Check, Flame, MoreVertical, Plus, Minus, Archive } from 'lucide-react';
import type { Habit } from '../../types/habit';
import clsx from 'clsx';
import { format } from 'date-fns';

interface HabitListProps {
    habits: Habit[];
    isLoading: boolean;
    onEdit: (habit: Habit) => void;
}

export const HabitList: React.FC<HabitListProps> = ({ habits, isLoading, onEdit }) => {
    const queryClient = useQueryClient();
    const today = format(new Date(), 'yyyy-MM-dd');

    const logMutation = useMutation({
        mutationFn: ({ id, count }: { id: string, count: number }) => habitService.log(id, today, count),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habits', 'stats'] });
        },
    });

    const archiveMutation = useMutation({
        mutationFn: ({ id, archive }: { id: string, archive: boolean }) => habitService.update(id, { isArchived: archive }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
        },
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-white dark:bg-gray-800 rounded-xl animate-pulse border border-gray-200 dark:border-gray-700" />
                ))}
            </div>
        );
    }

    const activeHabits = habits.filter(h => !h.isArchived);
    const archivedHabits = habits.filter(h => h.isArchived);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeHabits.map((habit) => {
                    const todayLog = habit.logs?.find((l: any) => l.date === today);
                    const isCompleted = todayLog?.isCompleted || false;
                    const progress = todayLog?.completedCount || 0;

                    return (
                        <div
                            key={habit.id}
                            className={clsx(
                                "group bg-white dark:bg-gray-800 p-5 rounded-2xl border transition-all duration-300",
                                isCompleted
                                    ? "border-green-200 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10"
                                    : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Flame className={clsx("w-5 h-5", habit.streak > 0 ? "text-orange-500 animate-pulse" : "text-gray-400")} />
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => onEdit(habit)}
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{habit.name}</h3>
                                {habit.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{habit.description}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">
                                        {habit.streak} day streak
                                    </span>
                                    {habit.targetCount > 1 && (
                                        <span className="text-xs font-medium text-primary">
                                            {progress} / {habit.targetCount}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                {habit.targetCount > 1 ? (
                                    <div className="flex items-center w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                        <button
                                            onClick={() => logMutation.mutate({ id: habit.id, count: -1 })}
                                            disabled={progress === 0}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all disabled:opacity-50"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <div className="flex-1 text-center font-bold text-sm">
                                            {progress}
                                        </div>
                                        <button
                                            onClick={() => logMutation.mutate({ id: habit.id, count: 1 })}
                                            className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => logMutation.mutate({ id: habit.id, count: isCompleted ? -1 : 1 })}
                                        className={clsx(
                                            "w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center transition-all",
                                            isCompleted
                                                ? "bg-green-500 text-white"
                                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white"
                                        )}
                                    >
                                        {isCompleted ? (
                                            <><Check className="w-4 h-4 mr-2" /> Completed</>
                                        ) : (
                                            "Mark Complete"
                                        )}
                                    </button>
                                )}

                                <button
                                    onClick={() => archiveMutation.mutate({ id: habit.id, archive: true })}
                                    className="p-2.5 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-xl transition-all"
                                    title="Archive"
                                >
                                    <Archive className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {archivedHabits.length > 0 && (
                <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Archive className="w-5 h-5 mr-2" /> Archived Habits
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                        {archivedHabits.map((habit) => (
                            <div key={habit.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{habit.name}</h3>
                                    <p className="text-xs text-gray-500">{habit.streak} day longest streak</p>
                                </div>
                                <button
                                    onClick={() => archiveMutation.mutate({ id: habit.id, archive: false })}
                                    className="text-primary hover:underline text-sm font-medium"
                                >
                                    Restore
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

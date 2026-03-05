import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService } from '../../services/habitService';
import { X, Bell, Target } from 'lucide-react';
import type { Habit } from '../../types/habit';

interface HabitModalProps {
    habit?: Habit | null;
    onClose: () => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ habit, onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        frequency_type: 'daily',
        target_count: 1,
        reminder_time: '',
    });

    useEffect(() => {
        if (habit) {
            setFormData({
                name: habit.name,
                description: habit.description || '',
                frequency_type: habit.frequencyType,
                target_count: habit.targetCount,
                reminder_time: habit.reminderTime || '',
            });
        }
    }, [habit]);

    const mutation = useMutation({
        mutationFn: (data: any) =>
            habit ? habitService.update(habit.id, data) : habitService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['habits'] });
            queryClient.invalidateQueries({ queryKey: ['habits', 'stats'] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {habit ? 'Edit Habit' : 'Create New Habit'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="e.g., Read for 30 mins"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                            placeholder="Why is this important?"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                            <select
                                value={formData.frequency_type}
                                onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                <Target className="w-3 h-3 mr-1" /> Target Count
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={formData.target_count}
                                onChange={(e) => setFormData({ ...formData, target_count: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Bell className="w-3 h-3 mr-1" /> Reminder Time
                        </label>
                        <input
                            type="time"
                            value={formData.reminder_time}
                            onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/25 transition-all disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Saving...' : habit ? 'Update Habit' : 'Create Habit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { habitService } from '../../services/habitService';
import { X, Bell, Target, Sparkles } from 'lucide-react';
import type { FrequencyType, Habit } from '../../types/habit';
import { ActionButton, SoftButton } from '../ui/shell';

type HabitFormValues = {
  name: string;
  description: string;
  frequency_type: FrequencyType;
  target_count: number;
  reminder_time: string;
};

interface HabitModalProps {
  habit?: Habit | null;
  onClose: () => void;
}

export const HabitModal: React.FC<HabitModalProps> = ({ habit, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    frequency_type: (habit?.frequencyType ?? 'daily') as FrequencyType,
    target_count: habit?.targetCount ?? 1,
    reminder_time: habit?.reminderTime ?? '',
  });

  const mutation = useMutation({
    mutationFn: (data: HabitFormValues) =>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/60 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-slate-900/92">
        <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/70 px-6 py-5 dark:border-white/10 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {habit ? 'Edit Habit' : 'Create New Habit'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Design a habit you will actually keep
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-white hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="e.g., Read for 30 mins"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="h-24 w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Why is this important?"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Frequency
              </label>
              <select
                value={formData.frequency_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency_type: e.target.value as FrequencyType,
                  })
                }
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Target className="mr-2 h-4 w-4" /> Target Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.target_count}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_count: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Bell className="mr-2 h-4 w-4" /> Reminder Time
            </label>
            <input
              type="time"
              value={formData.reminder_time}
              onChange={(e) =>
                setFormData({ ...formData, reminder_time: e.target.value })
              }
              className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <SoftButton type="button" onClick={onClose} className="flex-1">
              Cancel
            </SoftButton>
            <ActionButton type="submit" disabled={mutation.isPending} className="flex-1">
              {mutation.isPending
                ? 'Saving...'
                : habit
                  ? 'Update Habit'
                  : 'Create Habit'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};

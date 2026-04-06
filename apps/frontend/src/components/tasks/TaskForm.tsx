import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Bell, Calendar, Flag, Sparkles } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../types/task.ts';
import { ActionButton, SoftButton } from '../ui/shell';

type TaskFormValues = {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  reminderTime?: string;
};

interface TaskFormProps {
  onClose: () => void;
  onSubmit: (data: TaskFormValues) => void;
  initialData?: Partial<TaskFormValues>;
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onClose,
  onSubmit,
  initialData,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    defaultValues:
      initialData || {
        title: '',
        description: '',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date().toISOString().slice(0, 16),
      },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[32px] border border-white/60 bg-white/92 shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-slate-900/92">
        <div className="flex items-center justify-between border-b border-orange-100 bg-orange-50/70 px-6 py-5 dark:border-white/10 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                {initialData ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keep planning crisp and intentional
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="e.g., Weekly Standup"
            />
            {errors.title ? (
              <span className="mt-1 block text-xs text-red-500">
                {errors.title.message as string}
              </span>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              {...register('description')}
              className="h-28 w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Calendar className="mr-2 h-4 w-4" /> Due Date & Time
              </label>
              <input
                type="datetime-local"
                {...register('dueDate', { required: 'Due date is required' })}
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
                <Flag className="mr-2 h-4 w-4" /> Priority
              </label>
              <select
                {...register('priority')}
                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
              >
                <option value={TaskPriority.LOW}>Low</option>
                <option value={TaskPriority.MEDIUM}>Medium</option>
                <option value={TaskPriority.HIGH}>High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Bell className="mr-2 h-4 w-4" /> Reminder Notification
            </label>
            <input
              type="datetime-local"
              {...register('reminderTime')}
              className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-slate-900 outline-none transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Leave empty if no notification is needed.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <SoftButton type="button" onClick={onClose} className="sm:min-w-28">
              Cancel
            </SoftButton>
            <ActionButton type="submit" className="sm:min-w-36">
              {initialData ? 'Update Task' : 'Save Task'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
};

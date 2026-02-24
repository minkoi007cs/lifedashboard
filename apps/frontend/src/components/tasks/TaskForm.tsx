import React from 'react';
import { useForm } from 'react-hook-form';
import { X, Bell, Calendar, Flag } from 'lucide-react';
import { TaskStatus, TaskPriority } from '../../types/task.ts';

interface TaskFormProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSubmit, initialData }) => {
    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: initialData || {
            title: '',
            description: '',
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.TODO,
            dueDate: new Date().toISOString().slice(0, 16),
        }
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {initialData ? 'Edit Task' : 'Create New Task'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                        <input
                            {...register('title', { required: 'Title is required' })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            placeholder="e.g., Weekly Standup"
                        />
                        {errors.title && <span className="text-xs text-red-500">{errors.title.message as string}</span>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea
                            {...register('description')}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none h-24"
                            placeholder="Add details..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                <Calendar className="w-4 h-4 mr-2" /> Due Date & Time
                            </label>
                            <input
                                type="datetime-local"
                                {...register('dueDate', { required: 'Due date is required' })}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                                <Flag className="w-4 h-4 mr-2" /> Priority
                            </label>
                            <select
                                {...register('priority')}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            >
                                <option value={TaskPriority.LOW}>Low</option>
                                <option value={TaskPriority.MEDIUM}>Medium</option>
                                <option value={TaskPriority.HIGH}>High</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                            <Bell className="w-4 h-4 mr-2" /> Reminder Notification
                        </label>
                        <div className="flex space-x-2">
                            <input
                                type="datetime-local"
                                {...register('reminderTime')}
                                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Leave empty if no notification is needed.</p>
                    </div>

                    <div className="pt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-md shadow-primary/20 transition-all"
                        >
                            {initialData ? 'Update Task' : 'Save Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

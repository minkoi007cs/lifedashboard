import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Check, Trash2, Loader2, Square } from 'lucide-react';
import clsx from 'clsx';

interface Task {
    id: string;
    title: string;
    status: 'TODO' | 'DOING' | 'DONE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const TasksWidget: React.FC = () => {
    const queryClient = useQueryClient();
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const { data: tasks, isLoading } = useQuery<Task[]>({
        queryKey: ['tasks'],
        queryFn: async () => {
            const res = await api.get('/api/v1/tasks');
            return res.data;
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: (title: string) => api.post('/api/v1/tasks', { title }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setNewTaskTitle('');
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
            api.patch(`/api/v1/tasks/${id}`, { status }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const deleteTaskMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/api/v1/tasks/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTaskTitle.trim()) {
            createTaskMutation.mutate(newTaskTitle);
        }
    };

    const toggleStatus = (task: Task) => {
        const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
        updateStatusMutation.mutate({ id: task.id, status: newStatus });
    };

    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 flex items-center justify-between text-gray-900 dark:text-white">
                Tasks
                <span className="text-sm font-normal text-gray-500">{tasks?.filter(t => t.status !== 'DONE').length} remaining</span>
            </h2>

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                {tasks?.map((task) => (
                    <div key={task.id} className="flex items-center justify-between group p-2 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-md transition-colors">
                        <div className="flex items-center space-x-3">
                            <button onClick={() => toggleStatus(task)} className={clsx("text-gray-400 hover:text-primary", task.status === 'DONE' && "text-green-500")}>
                                {task.status === 'DONE' ? <Check className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                            </button>
                            <span className={clsx("text-sm", task.status === 'DONE' && "line-through text-gray-400")}>
                                {task.title}
                            </span>
                        </div>
                        <button
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                {tasks?.length === 0 && <p className="text-center text-gray-400 text-sm py-4">No tasks yet. Add one!</p>}
            </div>

            <form onSubmit={handleSubmit} className="relative">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="New task..."
                    className="w-full pl-3 pr-10 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                    className="absolute right-2 top-2 text-primary hover:text-primary-dark disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

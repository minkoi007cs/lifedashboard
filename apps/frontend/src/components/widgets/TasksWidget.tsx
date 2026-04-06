import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Check, Trash2, Loader2, Square } from 'lucide-react';
import clsx from 'clsx';
import { WidgetFrame } from '../ui/shell';

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

    if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    return (
        <WidgetFrame
            title="Tasks"
            icon={<Check className="h-5 w-5" />}
            meta={<span>{tasks?.filter(t => t.status !== 'DONE').length} remaining</span>}
            accent="from-pink-500 via-rose-500 to-orange-400"
        >

            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
                {tasks?.map((task) => (
                    <div key={task.id} className="group flex items-center justify-between rounded-2xl border border-transparent p-3 transition-colors hover:border-orange-100 hover:bg-orange-50/80 dark:hover:border-white/10 dark:hover:bg-slate-800/80">
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
                    className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 py-3 pl-4 pr-12 text-sm text-slate-800 outline-none ring-0 transition focus:border-pink-300 focus:bg-white dark:border-white/10 dark:bg-slate-800/90 dark:text-white"
                />
                <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                    className="absolute right-2 top-2 text-primary hover:text-primary-dark disabled:opacity-50"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>
        </WidgetFrame>
    );
};

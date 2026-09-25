import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import type { Task, TaskStatus } from '../../types/task';
import {
  Calendar,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Loader2,
  Search,
} from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import { format } from 'date-fns';

interface KanbanBoardProps {
  onOpenCreateTask: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onOpenCreateTask }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tasks = [], isLoading, isError } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/api/v1/tasks')).data,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) =>
      api.patch(`/api/v1/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
    },
    onError: () => {
      showToast('Cập nhật trạng thái nhiệm vụ thất bại', 'error');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast('Đã xóa nhiệm vụ', 'info');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-dashed border-red-200 py-12 text-center text-sm text-red-500 dark:border-red-900/30">
        Không thể tải danh sách nhiệm vụ. Vui lòng thử lại.
      </div>
    );
  }

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const todoTasks = filteredTasks.filter((t) => t.status === 'TODO');
  const doingTasks = filteredTasks.filter((t) => t.status === 'DOING');
  const doneTasks = filteredTasks.filter((t) => t.status === 'DONE');

  const columns: Array<{
    id: TaskStatus;
    title: string;
    icon: string;
    badgeColor: string;
    tasks: Task[];
  }> = [
    {
      id: 'TODO',
      title: 'Cần làm (To Do)',
      icon: '📝',
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      tasks: todoTasks,
    },
    {
      id: 'DOING',
      title: 'Đang làm (Doing)',
      icon: '⚡',
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
      tasks: doingTasks,
    },
    {
      id: 'DONE',
      title: 'Đã hoàn thành (Done)',
      icon: '✅',
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      tasks: doneTasks,
    },
  ];

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-950/60 dark:text-red-400">
            Cao
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            Trung bình
          </span>
        );
      case 'LOW':
        return (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            Thấp
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter and Quick Add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhiệm vụ..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <button
          type="button"
          onClick={onOpenCreateTask}
          className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" /> Thêm nhiệm vụ
        </button>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex flex-col rounded-3xl border border-slate-200/70 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/40"
          >
            {/* Column Header */}
            <div className="mb-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{col.icon}</span>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {col.title}
                </h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${col.badgeColor}`}
              >
                {col.tasks.length}
              </span>
            </div>

            {/* Task Cards List */}
            <div className="min-h-[400px] flex-1 space-y-3">
              {col.tasks.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-800">
                  <p className="text-xs text-slate-400">Không có nhiệm vụ nào</p>
                </div>
              ) : (
                col.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group relative rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >
                    {/* Priority & Delete */}
                    <div className="flex items-center justify-between">
                      {getPriorityBadge(task.priority)}
                      <button
                        type="button"
                        onClick={() => deleteTaskMutation.mutate(task.id)}
                        className="opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:hover:text-red-400"
                        title="Xóa nhiệm vụ"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </div>

                    {/* Title & Description */}
                    <h4
                      className={`mt-2 text-sm font-bold text-slate-900 dark:text-white ${
                        task.status === 'DONE' ? 'line-through opacity-70' : ''
                      }`}
                    >
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                    )}

                    {/* Due Date */}
                    {task.dueDate && (
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                      </div>
                    )}

                    {/* Status Move Actions */}
                    <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      {col.id === 'TODO' && (
                        <div className="flex w-full justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: 'DOING',
                              })
                            }
                            className="flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                          >
                            Bắt đầu <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {col.id === 'DOING' && (
                        <div className="flex w-full items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: 'TODO',
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            <ArrowLeft className="h-3 w-3" /> Quay lại
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: 'DONE',
                              })
                            }
                            className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400"
                          >
                            Hoàn thành <CheckCircle2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {col.id === 'DONE' && (
                        <div className="flex w-full justify-start">
                          <button
                            type="button"
                            onClick={() =>
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: 'DOING',
                              })
                            }
                            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                          >
                            <ArrowLeft className="h-3 w-3" /> Mở lại (Làm tiếp)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

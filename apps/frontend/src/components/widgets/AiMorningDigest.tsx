import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  Sparkles,
  Sun,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToastStore } from '../../store/toastStore';
import type { DailyDigest } from '@life-dashboard/shared';

export const AiMorningDigest: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: digest, isLoading, isFetching } = useQuery<DailyDigest>({
    queryKey: ['daily-digest'],
    queryFn: async () => (await api.get('/api/v1/notifications/digest')).data,
    staleTime: 5 * 60 * 1000,
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/v1/tasks/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Đã cập nhật trạng thái nhiệm vụ', 'success');
    },
  });

  const convertNotificationMutation = useMutation({
    mutationFn: async (notifId: string) =>
      api.post(`/api/v1/notifications/${notifId}/convert-to-task`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      showToast('Đã biến thông báo thành Task mới!', 'success');
    },
    onError: () => {
      showToast('Không thể tạo task từ thông báo này', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 p-6 backdrop-blur-xl dark:border-slate-800 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  if (!digest) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 p-5 shadow-sm transition-all duration-300 dark:border-indigo-900/40 dark:from-slate-900/95 dark:via-slate-900/80 dark:to-indigo-950/30 md:p-6">
      {/* Decorative accent glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-400/10 blur-3xl dark:bg-indigo-600/15" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-500/10" />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                <Sun className="h-3 w-3" /> LifeOS AI Digest
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">{digest.date}</span>
            </div>
            <h2 className="mt-1 text-base font-black tracking-tight text-slate-900 dark:text-white md:text-lg">
              {digest.greeting}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['daily-digest'] })}
            title="Làm mới bản tin"
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-5 space-y-4">
          {/* AI Focus Recommendation & Motivational Quote */}
          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Target className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 md:text-sm">
                {digest.focusRecommendation}
              </p>
            </div>
            {digest.quote && (
              <div className="border-t border-slate-100 pt-2 text-right dark:border-slate-800 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                  "{digest.quote.text}"
                </p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                  — {digest.quote.author}
                </p>
              </div>
            )}
          </div>

          {/* 3 Interactive Overview Columns */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {/* 1. Top Tasks */}
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Nhiệm vụ ({digest.taskSummary.totalPending})
                  </span>
                </div>
                <Link
                  to="/tasks"
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:underline dark:text-indigo-400"
                >
                  Tất cả <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {digest.taskSummary.topPriorities.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    🎉 Hoàn thành hết nhiệm vụ!
                  </p>
                ) : (
                  digest.taskSummary.topPriorities.map((t) => (
                    <div
                      key={t.id}
                      className="group flex items-center justify-between gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          toggleTaskMutation.mutate({
                            id: t.id,
                            status: t.status === 'DONE' ? 'TODO' : 'DONE',
                          })
                        }
                        className="flex items-center gap-2 overflow-hidden text-left"
                      >
                        {t.status === 'DONE' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-indigo-500 dark:text-slate-600" />
                        )}
                        <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                          {t.title}
                        </span>
                      </button>
                      <span
                        className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          t.priority === 'HIGH'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Habits & Streaks */}
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                    <Flame className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Thói quen ({digest.habitSummary.completedTodayCount}/{digest.habitSummary.dueTodayCount})
                  </span>
                </div>
                <Link
                  to="/habits"
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 transition hover:underline dark:text-indigo-400"
                >
                  Tất cả <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {digest.habitSummary.activeStreaks.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    Hãy tạo thói quen để bắt đầu streak!
                  </p>
                ) : (
                  digest.habitSummary.activeStreaks.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-2 rounded-xl p-1.5 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="truncate font-medium">{h.name}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-950/80 dark:text-amber-400">
                          <Flame className="h-3 w-3 fill-current" /> {h.streak}d
                        </span>
                        {h.isCompleted && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3. Notification Hub Highlights (External Ingestion) */}
            <div className="rounded-2xl border border-slate-100 bg-white/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/80 dark:text-purple-400">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Bản tin bên ngoài
                  </span>
                </div>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {digest.notificationHighlights.length === 0 ? (
                  <p className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
                    ✨ Không có thông báo quan trọng nào!
                  </p>
                ) : (
                  digest.notificationHighlights.map((n) => (
                    <div
                      key={n.id}
                      className="group flex items-center justify-between gap-2 rounded-xl p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                          {n.title}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">{n.message}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => convertNotificationMutation.mutate(n.id)}
                        title="Biến thông báo này thành Task"
                        className="flex h-7 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500"
                      >
                        <Plus className="h-3 w-3" /> Task
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

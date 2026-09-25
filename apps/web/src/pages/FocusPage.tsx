import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Target,
  Volume2,
  VolumeX,
  CheckCircle2,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { PageHeader, SurfaceCard } from '../components/ui/shell';
import { useToastStore } from '../store/toastStore';
import type { CreateFocusPayload } from '../types/focus';
import type { Task } from '../types/task';

type FocusPreset = {
  id: string;
  name: string;
  minutes: number;
  type: 'focus' | 'break';
  icon: string;
};

const PRESETS: FocusPreset[] = [
  { id: 'pomodoro', name: 'Pomodoro', minutes: 25, type: 'focus', icon: '🍅' },
  { id: 'sprint', name: 'Sprint', minutes: 15, type: 'focus', icon: '⚡' },
  { id: 'deepwork', name: 'Deep Work', minutes: 45, type: 'focus', icon: '🚀' },
  { id: 'flow', name: 'Flow State', minutes: 60, type: 'focus', icon: '🧘' },
  { id: 'shortbreak', name: 'Nghỉ ngắn', minutes: 5, type: 'break', icon: '☕' },
  { id: 'longbreak', name: 'Nghỉ dài', minutes: 15, type: 'break', icon: '🛋️' },
];

export const FocusPage: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [selectedPreset, setSelectedPreset] = useState<FocusPreset>(PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(PRESETS[0].minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [completedSessionsCount, setCompletedSessionsCount] = useState(0);

  const activePresetRef = useRef(selectedPreset);
  activePresetRef.current = selectedPreset;

  const totalSeconds = selectedPreset.minutes * 60;
  const progress = Math.min(100, Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  // Fetch pending tasks to link with focus session
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => (await api.get('/api/v1/tasks')).data,
  });
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE');

  const saveSessionMutation = useMutation({
    mutationFn: (data: CreateFocusPayload) => api.post('/api/v1/focus', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-stats'] });
    },
  });

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      api.patch(`/api/v1/tasks/${taskId}`, { status: 'DONE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast('Đã hoàn thành nhiệm vụ liên kết!', 'success');
      setSelectedTaskId('');
    },
  });

  // Web Audio chime using synthesizer harmonics
  const playChime = useCallback(() => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof window.AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.12 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 1.3);
      });
    } catch {
      // Audio playback restrictions fallback
    }
  }, [isSoundEnabled]);

  const handlePresetSelect = (preset: FocusPreset) => {
    setIsActive(false);
    setSelectedPreset(preset);
    setTimeLeft(preset.minutes * 60);
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsActive(false);

          playChime();

          const preset = activePresetRef.current;
          if (preset.type === 'focus') {
            const endTime = new Date();
            const startTime = new Date(endTime.getTime() - preset.minutes * 60000);
            saveSessionMutation.mutate({
              startTime,
              endTime,
              durationMinutes: preset.minutes,
              label: preset.name,
            });
            setCompletedSessionsCount((c) => c + 1);
            showToast(
              `Tuyệt vời! Bạn vừa hoàn thành ${preset.minutes} phút tập trung (${preset.name}).`,
              'success',
              6000,
            );
          } else {
            showToast('Hết giờ nghỉ ngơi! Sẵn sàng quay lại tập trung nhé.', 'info', 5000);
          }

          return preset.minutes * 60;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isActive, playChime, saveSessionMutation, showToast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress calculations (Radius 100, circumference 628.3)
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Deep Work & Flow"
        title="Focus Timer & Pomodoro"
        description="Rèn luyện khả năng tập trung sâu với các chu kỳ Pomodoro, âm thanh chuông sinh học và liên kết trực tiếp với Nhiệm vụ."
        icon={<Target className="h-6 w-6" />}
      />

      {/* Mode Presets Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {PRESETS.map((p) => {
          const isSelected = selectedPreset.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetSelect(p)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isSelected
                  ? p.type === 'focus'
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/25 scale-105'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25 scale-105'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.name} ({p.minutes}m)</span>
            </button>
          );
        })}
      </div>

      <SurfaceCard className="relative flex flex-col items-center justify-center overflow-hidden py-10">
        {/* Sound toggle */}
        <div className="absolute right-6 top-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSoundEnabled((v) => !v)}
            title={isSoundEnabled ? 'Tắt âm thanh chuông' : 'Bật âm thanh chuông'}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300"
          >
            {isSoundEnabled ? (
              <>
                <Volume2 className="h-4 w-4 text-indigo-500" />
                <span>Chuông: Bật</span>
              </>
            ) : (
              <>
                <VolumeX className="h-4 w-4 text-slate-400" />
                <span>Chuông: Tắt</span>
              </>
            )}
          </button>
        </div>

        {/* Task linking */}
        <div className="mb-6 w-full max-w-md px-4">
          <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            🎯 Mục tiêu phiên tập trung:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-xs font-semibold text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="">Tập trung tự do (Không gắn Task)</option>
            {pendingTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority})
              </option>
            ))}
          </select>
        </div>

        {/* Circular SVG Timer */}
        <div className="relative flex items-center justify-center">
          <svg className="h-64 w-64 -rotate-90 transform" viewBox="0 0 240 240">
            {/* Background Ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-100 dark:text-slate-800/80"
            />
            {/* Active Progress Ring */}
            <circle
              cx="120"
              cy="120"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className={`transition-all duration-1000 ${
                selectedPreset.type === 'focus'
                  ? 'text-indigo-600 dark:text-indigo-500'
                  : 'text-emerald-500 dark:text-emerald-400'
              }`}
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-5xl font-black tracking-wider text-slate-900 dark:text-white md:text-6xl">
              {formatTime(timeLeft)}
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              {isActive ? 'Đang tập trung...' : selectedPreset.name}
            </span>
            <span className="mt-0.5 text-[11px] font-semibold text-slate-400">
              {Math.round(progress)}% hoàn thành
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-8 flex items-center gap-5">
          <button
            type="button"
            onClick={() => setIsActive((v) => !v)}
            className={`flex h-16 w-16 items-center justify-center rounded-full shadow-xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600'
                : selectedPreset.type === 'focus'
                ? 'bg-indigo-600 text-white shadow-indigo-600/30 hover:bg-indigo-700'
                : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700'
            }`}
          >
            {isActive ? (
              <Pause className="h-7 w-7" />
            ) : (
              <Play className="ml-1 h-7 w-7 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsActive(false);
              setTimeLeft(selectedPreset.minutes * 60);
            }}
            title="Đặt lại phiên"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Linked Task Action Prompt if selected */}
        {selectedTaskId && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs text-indigo-900 dark:border-indigo-950 dark:bg-indigo-950/40 dark:text-indigo-200">
            <span>Đang làm: <strong>{tasks.find((t) => t.id === selectedTaskId)?.title}</strong></span>
            <button
              type="button"
              onClick={() => completeTaskMutation.mutate(selectedTaskId)}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Đánh dấu xong Task
            </button>
          </div>
        )}

        {/* Footer Metrics */}
        <div className="mt-8 flex items-center gap-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div>
            <p className="text-base font-black text-slate-800 dark:text-slate-200">
              {completedSessionsCount}
            </p>
            <p className="text-[10px] uppercase tracking-wider">Phiên đã xong hôm nay</p>
          </div>
          <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
          <div>
            <p className="text-base font-black text-slate-800 dark:text-slate-200">
              {completedSessionsCount * selectedPreset.minutes} phút
            </p>
            <p className="text-[10px] uppercase tracking-wider">Tổng thời gian tập trung</p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
};

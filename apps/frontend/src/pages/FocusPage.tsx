import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import clsx from 'clsx';
import { PageHeader, SurfaceCard } from '../components/ui/shell';
import { useToastStore } from '../store/toastStore';

const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

type FocusSessionPayload = {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
    label: string;
};

export const FocusPage: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
    const [isActive, setIsActive] = useState(false);
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);

    const saveSessionMutation = useMutation({
        mutationFn: (data: FocusSessionPayload) => api.post('/api/v1/focus', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus-stats'] }),
    });

    useEffect(() => {
        if (!isActive) return;

        const interval = window.setInterval(() => {
            setTimeLeft((current) => {
                if (current <= 1) {
                    window.clearInterval(interval);
                    setIsActive(false);

                    const endTime = new Date();
                    const startTime = new Date(endTime.getTime() - SESSION_MINUTES * 60000);
                    saveSessionMutation.mutate({ startTime, endTime, durationMinutes: SESSION_MINUTES, label: 'Pomodoro' });
                    showToast('Focus session complete! Great work.', 'success', 5000);
                    return SESSION_SECONDS;
                }
                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(interval);
    }, [isActive, saveSessionMutation, showToast]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((SESSION_SECONDS - timeLeft) / SESSION_SECONDS) * 100;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Deep Work"
                title="Focus Timer"
                description="25-minute Pomodoro sessions to build momentum and track your deep work over time."
                icon={<Target className="h-6 w-6" />}
            />

            <SurfaceCard className="flex flex-col items-center justify-center py-12">
                <div className="mb-8 h-56 w-56 rounded-full bg-[conic-gradient(from_180deg,theme(colors.sky.400),theme(colors.cyan.500),theme(colors.blue.500))] p-2.5 shadow-xl shadow-cyan-300/30">
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white/95 dark:bg-slate-900">
                        <div className="text-5xl font-black tracking-[0.12em] text-slate-900 dark:text-white">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                            {Math.round(progress)}% done
                        </div>
                    </div>
                </div>

                <div className="mb-8 h-2.5 w-72 rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500 transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex gap-5">
                    <button
                        onClick={() => setIsActive((v) => !v)}
                        className={clsx(
                            'rounded-full p-5 shadow-lg transition-colors',
                            isActive
                                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900',
                        )}
                    >
                        {isActive ? <Pause className="h-9 w-9" /> : <Play className="ml-1 h-9 w-9 fill-current" />}
                    </button>
                    <button
                        onClick={() => { setIsActive(false); setTimeLeft(SESSION_SECONDS); }}
                        className="rounded-full bg-orange-50 p-5 text-slate-600 transition hover:bg-orange-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                        <RotateCcw className="h-9 w-9" />
                    </button>
                </div>

                <p className="mt-6 text-sm text-slate-400">
                    {isActive ? 'Session in progress — stay focused!' : 'Press play to start a 25-minute session.'}
                </p>
            </SurfaceCard>
        </div>
    );
};

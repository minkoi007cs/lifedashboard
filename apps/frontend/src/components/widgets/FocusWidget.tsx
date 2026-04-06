import React, { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import clsx from 'clsx';
import { WidgetFrame } from '../ui/shell';

type FocusSessionPayload = {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  label: string;
};

const SESSION_MINUTES = 25;
const SESSION_SECONDS = SESSION_MINUTES * 60;

export const FocusWidget: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(SESSION_SECONDS);
  const [isActive, setIsActive] = useState(false);
  const queryClient = useQueryClient();

  const saveSessionMutation = useMutation({
    mutationFn: (data: FocusSessionPayload) => api.post('/api/v1/focus', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus-stats'] }),
  });

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          window.clearInterval(interval);
          setIsActive(false);

          const endTime = new Date();
          const startTime = new Date(endTime.getTime() - SESSION_MINUTES * 60000);
          saveSessionMutation.mutate({
            startTime,
            endTime,
            durationMinutes: SESSION_MINUTES,
            label: 'Pomodoro',
          });

          window.alert('Focus session complete!');
          return SESSION_SECONDS;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isActive, saveSessionMutation]);

  const toggleTimer = () => setIsActive((value) => !value);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(SESSION_SECONDS);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const progress = ((SESSION_SECONDS - timeLeft) / SESSION_SECONDS) * 100;

  return (
    <WidgetFrame
      title="Focus"
      icon={<Target className="h-5 w-5" />}
      meta="25-minute deep work sprint"
      accent="from-sky-400 via-cyan-500 to-blue-500"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="mb-6 h-40 w-40 rounded-full bg-[conic-gradient(from_180deg,var(--tw-gradient-from),var(--tw-gradient-via),var(--tw-gradient-to))] from-sky-400 via-cyan-500 to-blue-500 p-2 shadow-lg shadow-cyan-300/30">
          <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white/95 dark:bg-slate-900">
            <div className="text-4xl font-black tracking-[0.15em] text-slate-900 dark:text-white">
              {formatTime(timeLeft)}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {Math.round(progress)}% done
            </div>
          </div>
        </div>

        <div className="mb-5 h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500 transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={toggleTimer}
            className={clsx(
              'rounded-full p-4 shadow-lg transition-colors',
              isActive
                ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900',
            )}
          >
            {isActive ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="ml-1 h-8 w-8 fill-current" />
            )}
          </button>
          <button
            onClick={resetTimer}
            className="rounded-full bg-orange-50 p-4 text-slate-600 transition hover:bg-orange-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RotateCcw className="h-8 w-8" />
          </button>
        </div>
      </div>
    </WidgetFrame>
  );
};

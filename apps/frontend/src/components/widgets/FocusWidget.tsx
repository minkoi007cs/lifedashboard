import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Target } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import clsx from 'clsx';

export const FocusWidget: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const queryClient = useQueryClient();

    const saveSessionMutation = useMutation({
        mutationFn: (data: any) => api.post('/api/v1/focus', data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['focus-stats'] }),
    });

    const onTimerComplete = useCallback(() => {
        setIsActive(false);
        const duration = 25;
        const startTime = new Date(Date.now() - duration * 60000);
        const endTime = new Date();
        saveSessionMutation.mutate({ startTime, endTime, durationMinutes: duration, label: 'Pomodoro' });
        alert('Focus session complete!');
        setTimeLeft(25 * 60);
    }, [saveSessionMutation]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((t) => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            onTimerComplete();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, timeLeft, onTimerComplete]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(25 * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col items-center justify-center relative">
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center self-start">
                <Target className="w-5 h-5 mr-2" />
                Focus
            </h2>

            <div className="text-6xl font-mono font-bold text-gray-900 dark:text-white mb-8 tracking-widest">
                {formatTime(timeLeft)}
            </div>

            <div className="flex space-x-4">
                <button
                    onClick={toggleTimer}
                    className={clsx(
                        'p-4 rounded-full transition-colors shadow-lg',
                        isActive ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900',
                    )}
                >
                    {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
                <button
                    onClick={resetTimer}
                    className="p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                    <RotateCcw className="w-8 h-8" />
                </button>
            </div>
        </div>
    );
};

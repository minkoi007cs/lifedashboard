import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Scale, Loader2, Check } from 'lucide-react';
import { ActionButton, SurfaceCard } from '../ui/shell';

export const WeightLogForm: React.FC = () => {
    const queryClient = useQueryClient();
    const [weight, setWeight] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const mutation = useMutation({
        mutationFn: (data: { weight: number, date: string }) => api.post('/api/v1/calories/weight', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calories-statistics'] });
            setWeight('');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!weight) return;
        mutation.mutate({ weight: Number(weight), date });
    };

    return (
        <SurfaceCard>
            <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <Scale className="w-5 h-5 mr-2 text-blue-500" />
                Track Weight
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Weight (kg)</label>
                        <input
                            type="number"
                            step="0.1"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            placeholder="0.0"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                            required
                        />
                    </div>
                </div>

                <ActionButton
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : (mutation.isSuccess ? <Check className="w-5 h-5 mr-2" /> : <Scale className="w-5 h-5 mr-2" />)}
                    {mutation.isSuccess ? 'Logged!' : 'Log Weight'}
                </ActionButton>
            </form>
        </SurfaceCard>
    );
};

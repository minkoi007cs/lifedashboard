import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Scale, Loader2, Check } from 'lucide-react';

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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
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
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
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
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : (mutation.isSuccess ? <Check className="w-5 h-5 mr-2" /> : <Scale className="w-5 h-5 mr-2" />)}
                    {mutation.isSuccess ? 'Logged!' : 'Log Weight'}
                </button>
            </form>
        </div>
    );
};

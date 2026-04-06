import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Calculator, Loader2, Target } from 'lucide-react';
import { ActionButton, SurfaceCard } from '../ui/shell';

interface DietPlanFormProps {
    initialData?: {
        targetCalories?: number;
        proteinRatio?: number;
        fatRatio?: number;
        carbsRatio?: number;
    };
}

export const DietPlanForm: React.FC<DietPlanFormProps> = ({ initialData }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        targetCalories: initialData?.targetCalories || 2000,
        proteinRatio: initialData?.proteinRatio || 30,
        fatRatio: initialData?.fatRatio || 30,
        carbsRatio: initialData?.carbsRatio || 40,
        startDate: new Date().toISOString().split('T')[0],
    });

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/api/v1/calories/plan', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calories-statistics'] });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    const totalRatio = formData.proteinRatio + formData.fatRatio + formData.carbsRatio;

    return (
        <SurfaceCard>
            <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                Set Diet Goals
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Daily Calorie Target</label>
                    <input
                        type="number"
                        value={formData.targetCalories}
                        onChange={(e) => setFormData({ ...formData, targetCalories: Number(e.target.value) })}
                        className="w-full rounded-2xl border border-purple-100 bg-purple-50/70 p-3 text-lg font-bold text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Protein %</label>
                        <input
                            type="number"
                            value={formData.proteinRatio}
                            onChange={(e) => setFormData({ ...formData, proteinRatio: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 p-3 text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Fat %</label>
                        <input
                            type="number"
                            value={formData.fatRatio}
                            onChange={(e) => setFormData({ ...formData, fatRatio: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-yellow-100 bg-yellow-50/70 p-3 text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Carbs %</label>
                        <input
                            type="number"
                            value={formData.carbsRatio}
                            onChange={(e) => setFormData({ ...formData, carbsRatio: Number(e.target.value) })}
                            className="w-full rounded-2xl border border-green-100 bg-green-50/70 p-3 text-gray-900 outline-none transition-all dark:border-white/10 dark:bg-slate-800 dark:text-white"
                        />
                    </div>
                </div>

                {totalRatio !== 100 && (
                    <p className="text-xs text-red-500 font-bold">Total ratio must equal 100% (Current: {totalRatio}%)</p>
                )}

                <ActionButton
                    type="submit"
                    disabled={mutation.isPending || totalRatio !== 100}
                    className="w-full"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="w-5 h-5 mr-2" />}
                    Save Diet Plan
                </ActionButton>
            </form>
        </SurfaceCard>
    );
};

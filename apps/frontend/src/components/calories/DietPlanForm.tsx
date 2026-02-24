import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Calculator, Loader2, Target } from 'lucide-react';

interface DietPlanFormProps {
    initialData?: any;
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
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
                        className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-purple-500 transition-all text-gray-900 dark:text-white text-lg font-bold"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Protein %</label>
                        <input
                            type="number"
                            value={formData.proteinRatio}
                            onChange={(e) => setFormData({ ...formData, proteinRatio: Number(e.target.value) })}
                            className="w-full bg-blue-50 dark:bg-blue-900/20 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Fat %</label>
                        <input
                            type="number"
                            value={formData.fatRatio}
                            onChange={(e) => setFormData({ ...formData, fatRatio: Number(e.target.value) })}
                            className="w-full bg-yellow-50 dark:bg-yellow-900/20 border-none rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Carbs %</label>
                        <input
                            type="number"
                            value={formData.carbsRatio}
                            onChange={(e) => setFormData({ ...formData, carbsRatio: Number(e.target.value) })}
                            className="w-full bg-green-50 dark:bg-green-900/20 border-none rounded-xl p-3 focus:ring-2 focus:ring-green-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {totalRatio !== 100 && (
                    <p className="text-xs text-red-500 font-bold">Total ratio must equal 100% (Current: {totalRatio}%)</p>
                )}

                <button
                    type="submit"
                    disabled={mutation.isPending || totalRatio !== 100}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Calculator className="w-5 h-5 mr-2" />}
                    Save Diet Plan
                </button>
            </form>
        </div>
    );
};

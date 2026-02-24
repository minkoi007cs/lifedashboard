import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Search, Loader2 } from 'lucide-react';

interface FoodLogFormProps {
    onSuccess?: () => void;
}

export const FoodLogForm: React.FC<FoodLogFormProps> = ({ onSuccess }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        amount: 100,
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        mealType: 'Snack',
        date: new Date().toISOString().split('T')[0]
    });

    const mutation = useMutation({
        mutationFn: (data: typeof formData) => api.post('/api/v1/calories/food', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calories-statistics'] });
            setFormData({
                ...formData,
                name: '',
                calories: 0,
                protein: 0,
                fat: 0,
                carbs: 0
            });
            if (onSuccess) onSuccess();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 flex items-center text-gray-900 dark:text-white">
                <Plus className="w-5 h-5 mr-2 text-orange-500" />
                Log Food Item
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Food Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                            placeholder="e.g. Chicken Breast"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Amount (g/ml)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Calories</label>
                        <input
                            type="number"
                            value={formData.calories}
                            onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Protein (g)</label>
                        <input
                            type="number"
                            value={formData.protein}
                            onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Fat (g)</label>
                        <input
                            type="number"
                            value={formData.fat}
                            onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Carbs (g)</label>
                        <input
                            type="number"
                            value={formData.carbs}
                            onChange={(e) => setFormData({ ...formData, carbs: Number(e.target.value) })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Meal Type</label>
                        <select
                            value={formData.mealType}
                            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                        >
                            <option>Breakfast</option>
                            <option>Lunch</option>
                            <option>Dinner</option>
                            <option>Snack</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all text-gray-900 dark:text-white"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-600/20 transition-all flex items-center justify-center disabled:opacity-50"
                >
                    {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    Add Entry
                </button>
            </form>
        </div>
    );
};

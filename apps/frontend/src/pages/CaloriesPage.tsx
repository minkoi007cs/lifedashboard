import React, { useState } from 'react';
import { Utensils, Scale, Calculator, ChartBar, Plus, Loader2, Flame } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { CaloriesStats } from '../types/calories';
import { FoodLogForm } from '../components/calories/FoodLogForm';
import { WeightLogForm } from '../components/calories/WeightLogForm';
import { DietPlanForm } from '../components/calories/DietPlanForm';
import { FoodLogTable } from '../components/calories/FoodLogTable';
import { WeightTrendChart } from '../components/calories/WeightTrendChart';
import { PageHeader, SegmentedTabs, SurfaceCard } from '../components/ui/shell';

export const CaloriesPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'food' | 'weight' | 'plan'>('dashboard');
    const queryClient = useQueryClient();

    const { data: stats, isLoading } = useQuery<CaloriesStats>({
        queryKey: ['calories-statistics'],
        queryFn: async () => {
            const res = await api.get('/api/v1/calories/statistics');
            return res.data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/api/v1/calories/food/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['calories-statistics'] });
        },
    });

    if (isLoading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
        </div>
    );

    return (
        <div className="space-y-6 text-gray-900 dark:text-white">
            <PageHeader
                eyebrow="Nutrition"
                title="Calories & Diet"
                description="Track food intake, weight trends and diet goals with a calmer, mobile-friendly workflow."
                icon={<Utensils className="h-6 w-6" />}
                actions={
                    <SegmentedTabs
                        value={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: 'dashboard', icon: ChartBar, label: 'Dashboard' },
                            { id: 'food', icon: Plus, label: 'Log Food' },
                            { id: 'weight', icon: Scale, label: 'Weight' },
                            { id: 'plan', icon: Calculator, label: 'Planning' },
                        ]}
                        className="xl:w-auto"
                    />
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-8">
                    {activeTab === 'dashboard' && (
                        <>
                            <WeightTrendChart logs={stats?.weightTrend || []} />
                            <FoodLogTable
                                entries={stats?.allEntries || []}
                                onDelete={(id) => deleteMutation.mutate(id)}
                            />
                        </>
                    )}
                    {activeTab === 'food' && <FoodLogForm onSuccess={() => setActiveTab('dashboard')} />}
                    {activeTab === 'weight' && <WeightLogForm />}
                    {activeTab === 'plan' && <DietPlanForm initialData={stats?.activePlan ?? undefined} />}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <SurfaceCard>
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <Flame className="w-5 h-5 mr-2 text-orange-500" />
                            Today's Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500">Calories</span>
                                <span className="font-bold">{stats?.today.calories.toFixed(0)} / {stats?.today.target} kcal</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                    className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((stats?.today.calories || 0) / (stats?.today.target || 2000) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-blue-600">Protein</p>
                                    <p className="font-black">{stats?.today.macros.protein.toFixed(0)}g</p>
                                </div>
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-yellow-600">Fat</p>
                                    <p className="font-black">{stats?.today.macros.fat.toFixed(0)}g</p>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p className="text-[10px] uppercase font-bold text-green-600">Carbs</p>
                                    <p className="font-black">{stats?.today.macros.carbs.toFixed(0)}g</p>
                                </div>
                            </div>
                        </div>
                    </SurfaceCard>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Utensils, Flame, Scale, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CaloriesStats } from '../../types/calories';

export const CaloriesWidget: React.FC = () => {
    const { data: stats, isLoading } = useQuery<CaloriesStats>({
        queryKey: ['calories-statistics'],
        queryFn: async () => {
            const res = await api.get('/api/v1/calories/statistics');
            return res.data;
        },
    });

    if (isLoading) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" />
        </div>
    );

    const percent = stats ? Math.min((stats.today.calories / stats.today.target) * 100, 100) : 0;
    const latestWeight = stats?.weightTrend[stats.weightTrend.length - 1]?.weight;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col justify-between border border-gray-100 dark:border-gray-700">
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                    <Utensils className="w-5 h-5 mr-2 text-orange-500" />
                    Calories / Diet
                </h2>

                <div className="space-y-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                        <div className="flex justify-between items-end mb-2">
                            <div>
                                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider">Today's Intake</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {stats?.today.calories.toFixed(0) || 0} <span className="text-sm font-normal text-gray-500">/ {stats?.today.target || 2000} kcal</span>
                                </p>
                            </div>
                            <Flame className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Latest Weight</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">
                                {latestWeight ? `${latestWeight} kg` : '--'}
                            </p>
                        </div>
                        <Scale className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
            </div>

            <Link
                to="/calories"
                className="mt-4 w-full py-2 text-center text-sm font-bold text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 transition-colors flex items-center justify-center"
            >
                View Details <ChevronRight className="ml-1 w-4 h-4" />
            </Link>
        </div>
    );
};

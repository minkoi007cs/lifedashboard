import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Utensils, Flame, Scale, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CaloriesStats } from '../../types/calories';
import { LinkLikeFooter, WidgetFrame } from '../ui/shell';

export const CaloriesWidget: React.FC = () => {
  const { data: stats, isLoading } = useQuery<CaloriesStats>({
    queryKey: ['calories-statistics'],
    queryFn: async () => {
      const res = await api.get('/api/v1/calories/statistics');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  }

  const percent = stats ? Math.min((stats.today.calories / stats.today.target) * 100, 100) : 0;
  const latestWeight = stats?.weightTrend[stats.weightTrend.length - 1]?.weight;

  return (
    <WidgetFrame
      title="Calories / Diet"
      icon={<Utensils className="h-5 w-5" />}
      meta="Nutrition at a glance"
      accent="from-orange-400 via-amber-500 to-yellow-400"
      footer={
        <Link to="/calories" className="block">
          <LinkLikeFooter>View Details</LinkLikeFooter>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[24px] bg-orange-50 p-4 dark:bg-orange-900/20">
          <div className="mb-2 flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Today's Intake
              </p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {stats?.today.calories.toFixed(0) || 0}{' '}
                <span className="text-sm font-normal text-gray-500">
                  / {stats?.today.target || 2000} kcal
                </span>
              </p>
            </div>
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-2 rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-blue-50 p-4 dark:bg-blue-900/20">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Latest Weight
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {latestWeight ? `${latestWeight} kg` : '--'}
            </p>
          </div>
          <Scale className="h-6 w-6 text-blue-500" />
        </div>
      </div>
    </WidgetFrame>
  );
};

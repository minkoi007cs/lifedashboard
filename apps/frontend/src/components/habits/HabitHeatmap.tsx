import React from 'react';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, startOfMonth } from 'date-fns';
import clsx from 'clsx';
import { HelpCircle } from 'lucide-react';
import { SurfaceCard } from '../ui/shell';

interface HabitHeatmapProps {
    data: { date: string; count: number }[];
    isLoading: boolean;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ data, isLoading }) => {
    // Actually for a monthly heatmap as requested in the task, let's just show the current month clearly
    const currentMonthStart = startOfMonth(new Date());
    const days = eachDayOfInterval({
        start: startOfWeek(currentMonthStart),
        end: endOfWeek(new Date())
    });

    if (isLoading) {
        return <div className="h-64 rounded-[28px] bg-white/70 animate-pulse dark:bg-slate-800/70" />;
    }

    return (
        <SurfaceCard className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                    Consistency Heatmap
                    <HelpCircle className="w-4 h-4 ml-2 text-gray-400 cursor-help" />
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Less</span>
                    <div className="flex space-x-1">
                        <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-700" />
                        <div className="w-3 h-3 rounded-sm bg-primary/30" />
                        <div className="w-3 h-3 rounded-sm bg-primary/60" />
                        <div className="w-3 h-3 rounded-sm bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-grid grid-flow-col grid-rows-7 gap-1">
                    {days.map((day) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayData = data.find(d => d.date === dateStr);
                        const count = dayData?.count || 0;
                        const isCurrentMonth = isSameMonth(day, new Date());

                        return (
                            <div
                                key={dateStr}
                                title={`${dateStr}: ${count} completions`}
                                className={clsx(
                                    "w-3 h-3 rounded-sm transition-all duration-300 transform hover:scale-150 cursor-pointer",
                                    !isCurrentMonth && "opacity-30",
                                    count === 0 && "bg-gray-100 dark:bg-gray-700",
                                    count === 1 && "bg-primary/30",
                                    count === 2 && "bg-primary/60",
                                    count >= 3 && "bg-primary"
                                )}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="mt-4 flex justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
            </div>
        </SurfaceCard>
    );
};

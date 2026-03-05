import { type Habit, type HabitStatistics } from '../../types/habit';
import { format, parseISO } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';

interface HabitChartsProps {
    habits: Habit[];
    stats?: HabitStatistics;
    isLoading: boolean;
}

export const HabitCharts: React.FC<HabitChartsProps> = ({ habits, stats, isLoading }) => {
    if (isLoading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
                <div className="h-80 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
            </div>
        );
    }

    const completionData = stats.weeklySummary.map((day: any) => ({
        name: format(parseISO(day.date), 'EEE'),
        completed: day.completed,
        target: day.target,
    }));

    const streakData = habits.map(h => ({
        name: h.name,
        streak: h.streak,
        longest: h.longestStreak,
    })).sort((a, b) => b.streak - a.streak).slice(0, 5);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444'];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weekly Activity Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Weekly Activity</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={completionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            />
                            <YAxis
                                hide
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="completed" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Streaks Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Top Streaks</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={streakData} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#4B5563', fontSize: 10, fontWeight: 600 }}
                                width={100}
                            />
                            <Tooltip />
                            <Bar dataKey="streak" radius={[0, 4, 4, 0]} barSize={20}>
                                {streakData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

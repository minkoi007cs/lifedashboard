import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { TaskStats as ITaskStats } from '../../types/task.ts';
import { Loader2, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface TaskStatsProps {
    stats?: ITaskStats;
    isLoading: boolean;
}

export const TaskStats: React.FC<TaskStatsProps> = ({ stats, isLoading }) => {
    if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    if (!stats) return null;

    const statusData = [
        { name: 'Done', value: stats.statusStats.done, color: '#10B981' },
        { name: 'Pending', value: stats.statusStats.pending, color: '#3B82F6' },
    ];

    const priorityData = [
        { name: 'High', value: stats.priorityStats.high, color: '#EF4444' },
        { name: 'Medium', value: stats.priorityStats.medium, color: '#F59E0B' },
        { name: 'Low', value: stats.priorityStats.low, color: '#3B82F6' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Quick Stats */}
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.statusStats.done}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <Clock className="w-8 h-8 text-blue-500" />
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.statusStats.pending}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                        <span className="text-2xl font-black text-gray-900 dark:text-white">{stats.priorityStats.high}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">High Priority</p>
                </div>
            </div>

            {/* Charts */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Status Breakdown</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Tasks by Priority</h3>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priorityData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {priorityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

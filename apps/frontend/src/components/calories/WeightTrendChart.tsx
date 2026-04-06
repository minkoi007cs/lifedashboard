import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { WeightLog } from '../../types/calories';
import { SurfaceCard } from '../ui/shell';

interface WeightTrendChartProps {
    logs: WeightLog[];
}

export const WeightTrendChart: React.FC<WeightTrendChartProps> = ({ logs }) => {
    const data = logs.map(log => ({
        date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: log.weight
    }));

    return (
        <SurfaceCard className="h-[350px]">
            <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Weight Trend</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dx={-10}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1F2937',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#3B82F6', fontWeight: 'bold' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#3B82F6', strokeWidth: 0 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </SurfaceCard>
    );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { LayoutDashboard, PieChart as PieIcon, LineChart as LineIcon } from 'lucide-react';

interface StatsData {
    totalExpenses: number;
    totalRealProfit: number;
    sales: any[];
    expenses: any[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

export const FinanceStatsDashboard: React.FC = () => {
    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ['finance-stats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/statistics');
            return res.data;
        },
    });

    if (isLoading) return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-96 rounded-xl"></div>;
    if (!stats) return null;

    // Process data for charts
    const dailyIncomeData = stats.sales.slice(-7).map(s => ({
        date: s.date.split('-').slice(1).join('/'),
        income: s.cashCommission + s.netCheck + s.cashTips
    }));

    const expenseCategoryData = stats.expenses.reduce((acc: any[], curr) => {
        const existing = acc.find(a => a.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    const historicalProfitData = stats.sales.map(s => {
        const date = s.date;
        const income = s.cashCommission + s.netCheck + s.cashTips;
        const totalExpForDay = stats.expenses
            .filter(e => e.date === date)
            .reduce((sum, e) => sum + e.amount, 0);
        return {
            date: date.split('-').slice(1).join('/'),
            profit: income - totalExpForDay
        };
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Daily Income Chart */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <LayoutDashboard className="w-4 h-4 mr-2 text-blue-500" />
                        Daily Income (Last 7 Days)
                    </h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyIncomeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#60a5fa' }}
                                />
                                <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <PieIcon className="w-4 h-4 mr-2 text-emerald-500" />
                        Expense Breakdown
                    </h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={expenseCategoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {expenseCategoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                                />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Profit Trends */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <h4 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <LineIcon className="w-4 h-4 mr-2 text-purple-500" />
                    Profit Trends
                </h4>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalProfitData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* All-time Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Total Sales Record</p>
                    <p className="text-xl font-bold dark:text-white">{stats.sales.length} days</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Total Expenses</p>
                    <p className="text-xl font-bold dark:text-white text-red-500">${stats.totalExpenses.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">All-time Profit</p>
                    <p className="text-xl font-bold dark:text-white text-green-500">${stats.totalRealProfit.toFixed(0)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Efficiency</p>
                    <p className="text-xl font-bold dark:text-white">
                        {stats.totalExpenses > 0 ? (stats.totalRealProfit / (stats.totalRealProfit + stats.totalExpenses) * 100).toFixed(1) : 100}%
                    </p>
                </div>
            </div>
        </div>
    );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatMoney } from '../../lib/format-money';
import { DollarSign, ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LinkLikeFooter, WidgetFrame } from '../ui/shell';

interface Sale {
    serviceSales: number;
    cashTips: number;
    date: string;
}

interface Expense {
    amount: number;
    date: string;
}

interface StatsData {
    sales: Sale[];
    expenses: Expense[];
}

const TAX_RATE = 0.15;
const isThisMonth = (date: string) => {
    const now = new Date();
    const [year, month] = date.split('-').map(Number);
    return year === now.getFullYear() && month === now.getMonth() + 1;
};

export const FinanceWidget: React.FC = () => {
    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ['finance-stats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/statistics');
            return res.data;
        },
    });

    if (isLoading) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    const monthSales = stats?.sales.filter(sale => isThisMonth(sale.date)) ?? [];
    const monthExpenses = stats?.expenses.filter(expense => isThisMonth(expense.date)) ?? [];
    const checkIncome = monthSales.reduce((sum, sale) => sum + (sale.serviceSales || 0), 0);
    const cashIncome = monthSales.reduce((sum, sale) => sum + (sale.cashTips || 0), 0);
    const taxAmount = checkIncome * TAX_RATE;
    const expenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const balance = checkIncome - taxAmount + cashIncome - expenses;

    return (
        <WidgetFrame
            title="Finance"
            icon={<DollarSign className="h-5 w-5" />}
            meta="This month snapshot"
            accent="from-emerald-400 via-teal-500 to-cyan-500"
            footer={
                <Link to="/finance" className="block">
                    <LinkLikeFooter>Management</LinkLikeFooter>
                </Link>
            }
        >

                <div className="space-y-4">
                    <div className="rounded-[24px] bg-green-50 p-4 text-center dark:bg-green-900/20">
                        <p className="text-xs text-gray-500 dark:text-green-300 font-bold uppercase tracking-wider mb-1">
                            {balance >= 0 ? 'Balance' : 'Shortfall'}
                        </p>
                        <p className={`text-3xl font-black ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            {formatMoney(Math.abs(balance))}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center text-blue-600 mb-1">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                <span className="text-[10px] font-bold uppercase">Check</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(checkIncome)}</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center text-red-600 mb-1">
                                <ArrowDown className="w-3 h-3 mr-1" />
                                <span className="text-[10px] font-bold uppercase">Expenses</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(expenses)}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <div className="rounded-2xl bg-white/70 p-2 text-center dark:bg-slate-900/40">Cash {formatMoney(cashIncome)}</div>
                        <div className="rounded-2xl bg-white/70 p-2 text-center dark:bg-slate-900/40">Tax {formatMoney(taxAmount)}</div>
                    </div>
                </div>
        </WidgetFrame>
    );
};

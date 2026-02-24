import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { DollarSign, ArrowUp, ArrowDown, Loader2, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PayPeriod {
    grossEarnings: number;
    taxesPaid: number;
    netPayout: number;
    totalExpenses: number;
    realProfit: number;
}

export const FinanceWidget: React.FC = () => {
    const { data: period, isLoading } = useQuery<PayPeriod>({
        queryKey: ['active-pay-period'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/pay-period/active');
            return res.data;
        },
    });

    if (isLoading) return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full flex flex-col justify-between border border-gray-100 dark:border-gray-700">
            <div>
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-500" />
                    Finance
                </h2>

                <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-green-300 font-bold uppercase tracking-wider mb-1">Real Profit</p>
                        <p className={`text-3xl font-black ${period?.realProfit && period.realProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                            ${period?.realProfit.toFixed(0) ?? '0'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <div className="flex items-center text-blue-600 mb-1">
                                <ArrowUp className="w-3 h-3 mr-1" />
                                <span className="text-[10px] font-bold uppercase">Net Payout</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">${period?.netPayout.toFixed(0) ?? '0'}</p>
                        </div>
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/30">
                            <div className="flex items-center text-red-600 mb-1">
                                <ArrowDown className="w-3 h-3 mr-1" />
                                <span className="text-[10px] font-bold uppercase">Expenses</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">${period?.totalExpenses.toFixed(0) ?? '0'}</p>
                        </div>
                    </div>
                </div>
            </div>

            <Link
                to="/finance"
                className="mt-4 w-full py-2 text-center text-sm font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center"
            >
                Management <TrendingUp className="ml-2 w-4 h-4" />
            </Link>
        </div>
    );
};

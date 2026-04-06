import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Calendar, TrendingUp, DollarSign, Wallet, Percent, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ActionButton, SurfaceCard, SoftButton } from '../ui/shell';

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
};

interface PayPeriod {
    id: string;
    startDate: string;
    endDate: string;
    grossEarnings: number;
    taxesPaid: number;
    netPayout: number;
    totalExpenses: number;
    realProfit: number;
    isClosed: boolean;
}

export const PayPeriodSummary: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: activePeriod, isLoading } = useQuery<PayPeriod>({
        queryKey: ['active-pay-period'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/pay-period/active');
            return res.data;
        },
    });

    const startPeriodMutation = useMutation({
        mutationFn: async (startDate: string) => {
            const res = await api.post('/api/v1/finance/pay-period/start', { startDate });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['active-pay-period'] });
            alert('New pay period started successfully!');
        },
        onError: (error: ApiError) => {
            alert('Failed to start new period: ' + (error.response?.data?.message || error.message));
        }
    });

    const handleStartNewPeriod = () => {
        const date = new Date().toISOString().split('T')[0];
        if (activePeriod && !activePeriod.isClosed) {
            if (!confirm('You already have an active pay period. Starting a new one will close the current one. Continue?')) {
                return;
            }
        }
        startPeriodMutation.mutate(date);
    };

    if (isLoading) return <div className="h-64 animate-pulse rounded-[28px] bg-white/70 dark:bg-slate-800/70"></div>;

    if (!activePeriod) {
        return (
            <SurfaceCard className="border-dashed text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Active Pay Period</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start a new 14-day tracking cycle to see your detailed earnings and profits.</p>
                <ActionButton
                    onClick={handleStartNewPeriod}
                    className="mx-auto"
                >
                    Start Pay Period <ArrowRight className="ml-2 w-4 h-4" />
                </ActionButton>
            </SurfaceCard>
        );
    }

    const startDate = parseISO(activePeriod.startDate);
    const progress = Math.min(100, (new Date().getTime() - startDate.getTime()) / (14 * 24 * 60 * 60 * 1000) * 100);

    return (
        <SurfaceCard>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                        Current Pay Period
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {format(parseISO(activePeriod.startDate), 'MMM dd')} - {format(parseISO(activePeriod.endDate), 'MMM dd, yyyy')}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                        Active
                    </span>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <span>Period Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div className="h-2 rounded-full bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="flex items-center text-blue-600 dark:text-blue-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Gross</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${activePeriod.grossEarnings.toFixed(0)}</p>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <div className="flex items-center text-orange-600 dark:text-orange-400 mb-1">
                        <Percent className="w-4 h-4 mr-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Tax (15%)</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${activePeriod.taxesPaid.toFixed(0)}</p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="flex items-center text-green-600 dark:text-green-400 mb-1">
                        <Wallet className="w-4 h-4 mr-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Net Payout</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${activePeriod.netPayout.toFixed(0)}</p>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <div className="flex items-center text-red-600 dark:text-red-400 mb-1">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-xs font-bold uppercase tracking-wider">Expenses</span>
                    </div>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${activePeriod.totalExpenses.toFixed(0)}</p>
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Real Profit</span>
                <span className={`text-2xl font-black ${activePeriod.realProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${activePeriod.realProfit.toFixed(0)}
                </span>
            </div>

            <SoftButton
                onClick={handleStartNewPeriod}
                className="mt-6 w-full"
            >
                Start New Period
            </SoftButton>
        </SurfaceCard>
    );
};

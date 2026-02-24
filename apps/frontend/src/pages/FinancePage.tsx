import React, { useState } from 'react';
import { DailyEntryForm } from '../components/finance/DailyEntryForm';
import { PayPeriodSummary } from '../components/finance/PayPeriodSummary';
import { FinanceStatsDashboard } from '../components/finance/FinanceStatsDashboard';
import { Wallet, Calculator, ChartBar } from 'lucide-react';

export const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history'>('dashboard');

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
                        <Wallet className="w-8 h-8 mr-3 text-blue-600" />
                        Finance Manager
                    </h1>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Track your nail salon earnings, commission, and expenses in one place.
                    </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <ChartBar className="w-4 h-4 mr-2" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('entry')}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'entry'
                            ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calculator className="w-4 h-4 mr-2" />
                        Daily Entry
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {activeTab === 'dashboard' && <FinanceStatsDashboard />}
                    {activeTab === 'entry' && <DailyEntryForm />}
                </div>

                <div className="lg:col-span-4">
                    <PayPeriodSummary />
                </div>
            </div>
        </div>
    );
};

export default FinancePage;

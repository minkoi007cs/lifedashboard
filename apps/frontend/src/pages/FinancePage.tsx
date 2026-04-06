import React, { useState } from 'react';
import { DailyEntryForm } from '../components/finance/DailyEntryForm';
import { PayPeriodSummary } from '../components/finance/PayPeriodSummary';
import { FinanceStatsDashboard } from '../components/finance/FinanceStatsDashboard';
import { Wallet, Calculator, ChartBar } from 'lucide-react';
import { PageHeader, SegmentedTabs } from '../components/ui/shell';

export const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'history'>('dashboard');

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Money flow"
                title="Finance Manager"
                description="Track daily service income, tips, expenses and your current pay-period profit in one place."
                icon={<Wallet className="h-6 w-6" />}
                actions={
                    <SegmentedTabs
                        value={activeTab}
                        onChange={setActiveTab}
                        tabs={[
                            { id: 'dashboard', icon: ChartBar, label: 'Dashboard' },
                            { id: 'entry', icon: Calculator, label: 'Daily Entry' },
                        ]}
                        className="xl:w-auto"
                    />
                }
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
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

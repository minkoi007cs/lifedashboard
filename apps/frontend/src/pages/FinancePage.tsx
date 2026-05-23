import React, { useState } from 'react';
import { DailyEntryForm } from '../components/finance/DailyEntryForm';
import { FinanceStatsDashboard } from '../components/finance/FinanceStatsDashboard';
import { Wallet, Calculator, ChartBar } from 'lucide-react';
import { PageHeader, SegmentedTabs } from '../components/ui/shell';

export const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'entry'>('dashboard');

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Money flow"
                title="Finance Manager"
                description="Track check income, cash income, taxes, expenses, and monthly balance in one place."
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

            <div className="space-y-8">
                {activeTab === 'dashboard' && <FinanceStatsDashboard />}
                {activeTab === 'entry' && <DailyEntryForm />}
            </div>
        </div>
    );
};

export default FinancePage;

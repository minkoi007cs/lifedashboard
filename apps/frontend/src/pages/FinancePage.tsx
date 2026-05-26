import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { DailyEntryForm } from '../components/finance/DailyEntryForm';
import { FinanceStatsDashboard } from '../components/finance/FinanceStatsDashboard';
import { FinanceShareModal } from '../components/finance/FinanceShareModal';
import { Wallet, Calculator, ChartBar, Users, ChevronDown } from 'lucide-react';
import { PageHeader, SegmentedTabs, SoftButton } from '../components/ui/shell';

interface ReceivedShare {
    id: string;
    ownerId: string;
    owner: { id: string; name: string; email: string };
    permission: 'view' | 'edit';
    status: 'pending' | 'accepted' | 'rejected';
}

interface FinanceContext {
    userId: string;
    userName: string;
    userEmail: string;
    permission: 'view' | 'edit';
}

export const FinancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'entry'>('dashboard');
    const [activeContext, setActiveContext] = useState<FinanceContext | null>(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);

    const { data: receivedShares = [] } = useQuery<ReceivedShare[]>({
        queryKey: ['finance-shares-received'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/share/received');
            return res.data;
        },
    });

    const acceptedShares = receivedShares.filter(s => s.status === 'accepted');
    const pendingCount = receivedShares.filter(s => s.status === 'pending').length;

    const isReadOnly = activeContext?.permission === 'view';
    const targetUserId = activeContext?.userId;

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Money flow"
                title="Finance Manager"
                description="Track check income, cash income, taxes, expenses, and monthly balance in one place."
                icon={<Wallet className="h-6 w-6" />}
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Context switcher */}
                        <div className="relative z-30">
                            <button
                                onClick={() => setShowContextMenu(prev => !prev)}
                                onBlur={() => setTimeout(() => setShowContextMenu(false), 150)}
                                className="flex items-center gap-1.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="max-w-[120px] truncate">
                                    {activeContext ? activeContext.userName : 'My Finance'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            </button>

                            {showContextMenu && (
                                <div className="absolute right-0 top-full mt-1 z-40 w-56 rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
                                    <button
                                        onClick={() => { setActiveContext(null); setShowContextMenu(false); }}
                                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${
                                            !activeContext ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                                        }`}
                                    >
                                        {!activeContext && <span className="text-blue-500">✓</span>}
                                        {activeContext && <span className="w-4" />}
                                        My Finance
                                    </button>

                                    {acceptedShares.length > 0 && (
                                        <>
                                            <div className="mx-3 border-t border-gray-100 dark:border-slate-700" />
                                            {acceptedShares.map(share => (
                                                <button
                                                    key={share.id}
                                                    onClick={() => {
                                                        setActiveContext({
                                                            userId: share.ownerId,
                                                            userName: share.owner.name || share.owner.email,
                                                            userEmail: share.owner.email,
                                                            permission: share.permission,
                                                        });
                                                        setShowContextMenu(false);
                                                    }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${
                                                        activeContext?.userId === share.ownerId
                                                            ? 'font-semibold text-blue-600 dark:text-blue-400'
                                                            : 'text-gray-700 dark:text-gray-200'
                                                    }`}
                                                >
                                                    {activeContext?.userId === share.ownerId
                                                        ? <span className="text-blue-500">✓</span>
                                                        : <span className="w-4" />
                                                    }
                                                    <span className="flex-1 truncate">{share.owner.name || share.owner.email}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                                        share.permission === 'edit'
                                                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                                                    }`}>
                                                        {share.permission === 'edit' ? 'Edit' : 'View'}
                                                    </span>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Share button */}
                        <SoftButton
                            onClick={() => setShowShareModal(true)}
                            className="relative flex items-center gap-1.5 border border-gray-200 dark:border-slate-700"
                        >
                            <Users className="w-4 h-4" />
                            Share
                            {pendingCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                                    {pendingCount}
                                </span>
                            )}
                        </SoftButton>

                        <SegmentedTabs
                            value={activeTab}
                            onChange={setActiveTab}
                            tabs={[
                                { id: 'dashboard', icon: ChartBar, label: 'Dashboard' },
                                { id: 'entry', icon: Calculator, label: 'Daily Entry' },
                            ]}
                            className="xl:w-auto"
                        />
                    </div>
                }
            />

            {/* Context banner */}
            {activeContext && (
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 min-w-0">
                        <Users className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm font-semibold text-blue-800 dark:text-blue-300 truncate">
                            Viewing {activeContext.userName}'s Finance
                        </span>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${
                            activeContext.permission === 'edit'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                            {activeContext.permission === 'edit' ? 'Can Edit' : 'View Only'}
                        </span>
                    </div>
                    <button
                        onClick={() => setActiveContext(null)}
                        className="shrink-0 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium transition-colors ml-3"
                    >
                        Back to My Finance
                    </button>
                </div>
            )}

            <div className="space-y-8">
                {activeTab === 'dashboard' && (
                    <FinanceStatsDashboard targetUserId={targetUserId} />
                )}
                {activeTab === 'entry' && (
                    <DailyEntryForm targetUserId={targetUserId} isReadOnly={isReadOnly} />
                )}
            </div>

            {showShareModal && <FinanceShareModal onClose={() => setShowShareModal(false)} />}
        </div>
    );
};

export default FinancePage;

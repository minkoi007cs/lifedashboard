import React from 'react';
import { TasksWidget } from '../components/widgets/TasksWidget';
import { HabitsWidget } from '../components/widgets/HabitsWidget';
import { FinanceWidget } from '../components/widgets/FinanceWidget';
import { FocusWidget } from '../components/widgets/FocusWidget';
import { AdminWidget } from '../components/widgets/AdminWidget';
import { CaloriesWidget } from '../components/widgets/CaloriesWidget';
import { useAuthStore } from '../store/authStore';
import { PageHeader } from '../components/ui/shell';
import { Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <div className="space-y-6">
            <PageHeader
                eyebrow="Overview"
                title={`Welcome back${user?.name ? `, ${user.name}` : ''}`}
                description="Your dashboard brings together priorities, routines, money, nutrition and focus into one daily home base."
                icon={<Sparkles className="h-6 w-6" />}
            />
            <div className="grid grid-cols-1 gap-5 auto-rows-[350px] md:grid-cols-2 xl:grid-cols-3">
                <div className="col-span-1 md:col-span-1 lg:col-span-1">
                    <TasksWidget />
                </div>
                <div className="col-span-1">
                    <HabitsWidget />
                </div>
                <div className="col-span-1">
                    <FocusWidget />
                </div>
                <div className="col-span-1">
                    <FinanceWidget />
                </div>
                <div className="col-span-1">
                    <CaloriesWidget />
                </div>
                {user?.role === 'admin' && (
                    <div className="col-span-1">
                        <AdminWidget />
                    </div>
                )}
            </div>
        </div>
    );
};

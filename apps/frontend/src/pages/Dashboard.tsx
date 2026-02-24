import React from 'react';
import { TasksWidget } from '../components/widgets/TasksWidget';
import { HabitsWidget } from '../components/widgets/HabitsWidget';
import { FinanceWidget } from '../components/widgets/FinanceWidget';
import { FocusWidget } from '../components/widgets/FocusWidget';
import { AdminWidget } from '../components/widgets/AdminWidget';
import { CaloriesWidget } from '../components/widgets/CaloriesWidget';
import { useAuthStore } from '../store/authStore';

export const Dashboard: React.FC = () => {
    const { user } = useAuthStore();

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Welcome back{user?.name ? `, ${user.name}` : ''}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[350px]">
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

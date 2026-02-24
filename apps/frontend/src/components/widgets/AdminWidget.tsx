import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Shield, Users, Activity, Heart, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface AdminStats {
    totalUsers: number;
    activeSessions: number;
    systemHealth: string;
}

export const AdminWidget: React.FC = () => {
    const { user } = useAuthStore();

    const { data: stats, isLoading } = useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/admin/stats');
            return res.data;
        },
        enabled: user?.role === 'admin',
    });

    if (user?.role !== 'admin') return null;
    if (isLoading) return <Loader2 className="animate-spin" />;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-purple-500" />
                Admin Analytics
            </h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center">
                        <Users className="w-5 h-5 text-purple-600 mr-3" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Total Users</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalUsers ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center">
                        <Activity className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Active Sessions</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.activeSessions ?? 0}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center">
                        <Heart className="w-5 h-5 text-green-600 mr-3" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">System Health</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">{stats?.systemHealth ?? 'Unknown'}</span>
                </div>
            </div>
        </div>
    );
};

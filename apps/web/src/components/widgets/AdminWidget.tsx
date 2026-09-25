import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Shield, Users, Activity, Heart, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { WidgetFrame } from '../ui/shell';

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
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <WidgetFrame
      title="Admin Analytics"
      icon={<Shield className="h-5 w-5" />}
      meta="System snapshot"
      accent="from-violet-500 via-purple-500 to-fuchsia-500"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-[24px] bg-purple-50 p-4 dark:bg-purple-900/20">
          <div className="flex items-center">
            <Users className="mr-3 h-5 w-5 text-purple-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Total Users</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.totalUsers ?? 0}</span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex items-center">
            <Activity className="mr-3 h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Active Sessions</span>
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">{stats?.activeSessions ?? 0}</span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex items-center">
            <Heart className="mr-3 h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-700 dark:text-gray-300">System Health</span>
          </div>
          <span className="text-sm font-bold text-green-600">{stats?.systemHealth ?? 'Unknown'}</span>
        </div>
      </div>
    </WidgetFrame>
  );
};

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  X,
  RefreshCw,
  CheckCircle2,
  Github,
  Mail,
  Calendar,
  Cloud,
} from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { ConnectedAccountDto } from '@life-dashboard/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS = [
  {
    id: 'google',
    name: 'Google (Gmail & Lịch)',
    description: 'Đồng bộ email quan trọng và sự kiện lịch sắp tới.',
    icon: Mail,
    color: 'text-red-500 bg-red-50 dark:bg-red-950/60',
  },
  {
    id: 'microsoft',
    name: 'Microsoft 365 / Outlook',
    description: 'Đồng bộ email công việc và nhắc nhở hợp đồng.',
    icon: Calendar,
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Đồng bộ PR review requests và Issue được giao.',
    icon: Github,
    color: 'text-slate-800 bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
  },
] as const;

export const ConnectedAccountsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const { data: accounts = [] } = useQuery<ConnectedAccountDto[]>({
    queryKey: ['connected-accounts'],
    queryFn: async () => (await api.get('/api/v1/notifications/accounts')).data,
    enabled: isOpen,
  });

  const connectMutation = useMutation({
    mutationFn: async (provider: 'google' | 'microsoft' | 'github') =>
      api.post('/api/v1/notifications/accounts', {
        provider,
        emailOrUsername: `${provider}_user@lifeos.internal`,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      syncMutation.mutate(res.data.id);
      showToast('Đã kết nối tài khoản thành công', 'success');
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/api/v1/notifications/accounts/${id}/sync`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast(
        `Đã đồng bộ thành công (${res.data.newNotifications} thông báo mới)`,
        'success',
      );
    },
    onError: () => {
      showToast('Đồng bộ thất bại. Vui lòng thử lại.', 'error');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) =>
      api.delete(`/api/v1/notifications/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connected-accounts'] });
      showToast('Đã hủy liên kết tài khoản', 'info');
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="themed-surface relative w-full max-w-lg rounded-3xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Notification Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Liên kết Gmail, Outlook và GitHub để lọc tin & tạo Morning Digest
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-3.5">
          {PROVIDERS.map((prov) => {
            const connected = accounts.find((a) => a.provider === prov.id);
            const Icon = prov.icon;

            return (
              <div
                key={prov.id}
                className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/50"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${prov.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {prov.name}
                      </p>
                      {connected ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Đã kết nối
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Chưa liên kết
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {connected?.emailOrUsername || prov.description}
                    </p>
                    {connected?.lastSyncedAt && (
                      <p className="mt-0.5 text-[10px] text-slate-400">
                        Đồng bộ lần cuối: {new Date(connected.lastSyncedAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {connected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => syncMutation.mutate(connected.id)}
                        disabled={syncMutation.isPending}
                        title="Đồng bộ ngay"
                        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            syncMutation.isPending ? 'animate-spin' : ''
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => disconnectMutation.mutate(connected.id)}
                        className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Gỡ
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => connectMutation.mutate(prov.id)}
                      disabled={connectMutation.isPending}
                      className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Kết nối
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-[11px] text-slate-400">
            Dữ liệu được mã hóa an toàn & lọc thông minh chống spam.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

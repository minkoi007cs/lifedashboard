import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import {
  Mail,
  RefreshCw,
  Plus,
  Star,
  Search,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  Inbox,
  FolderOpen,
  Sparkles,
  Zap,
} from 'lucide-react';
import { PageHeader, SurfaceCard } from '../components/ui/shell';
import { useToastStore } from '../store/toastStore';
import { ConnectMailAccountModal } from '../components/mail/ConnectMailAccountModal';
import type {
  MailAccount,
  MailMessage,
  MailOverview,
  MailCategory,
} from '@life-dashboard/shared';
import { format } from 'date-fns';

export const MailPage: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<MailCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [copiedReply, setCopiedReply] = useState(false);

  // Queries
  const { data: overview } = useQuery<MailOverview>({
    queryKey: ['mail-overview'],
    queryFn: async () => (await api.get('/api/v1/mail/overview')).data,
  });

  const { data: accounts = [] } = useQuery<MailAccount[]>({
    queryKey: ['mail-accounts'],
    queryFn: async () => (await api.get('/api/v1/mail/accounts')).data,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MailMessage[]>({
    queryKey: ['mail-messages', selectedAccountId, selectedCategory, searchQuery],
    queryFn: async () => {
      const res = await api.get('/api/v1/mail/messages', {
        params: {
          accountId: selectedAccountId !== 'all' ? selectedAccountId : undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchQuery || undefined,
        },
      });
      return res.data;
    },
  });

  // Selected message details
  const { data: activeMessage } = useQuery<MailMessage>({
    queryKey: ['mail-message-detail', selectedMessageId],
    queryFn: async () => {
      if (!selectedMessageId) return null;
      const res = await api.get(`/api/v1/mail/messages/${selectedMessageId}`);
      return res.data;
    },
    enabled: !!selectedMessageId,
  });

  // Mutations
  const syncAllMutation = useMutation({
    mutationFn: async () => api.post('/api/v1/mail/sync-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast('Đã đồng bộ tất cả các tài khoản hòm thư!', 'success');
    },
  });

  const syncAccountMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/api/v1/mail/accounts/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      showToast('Đã đồng bộ tài khoản thành công', 'success');
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/mail/accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      showToast('Đã ngắt kết nối tài khoản mail', 'info');
      setSelectedAccountId('all');
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/api/v1/mail/messages/${id}/star`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-message-detail', selectedMessageId] });
    },
  });

  const convertToTaskMutation = useMutation({
    mutationFn: async (id: string) => api.post(`/api/v1/mail/messages/${id}/convert-to-task`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-message-detail', selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast('Đã chuyển đổi email thành Task trong LifeOS!', 'success');
    },
  });

  const convertToExpenseMutation = useMutation({
    mutationFn: async (id: string) =>
      api.post(`/api/v1/mail/messages/${id}/convert-to-expense`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-message-detail', selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      showToast('Đã lưu hóa đơn vào Sổ Thu Chi!', 'success');
    },
  });

  const handleCopyReply = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    showToast('Đã sao chép câu trả lời vào clipboard!', 'success');
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const getCategoryBadge = (cat: MailCategory) => {
    switch (cat) {
      case 'action_required':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <AlertCircle className="h-3 w-3" /> Cần xử lý
          </span>
        );
      case 'finance':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <DollarSign className="h-3 w-3" /> Hóa đơn
          </span>
        );
      case 'work':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            Công việc
          </span>
        );
      case 'newsletter':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
            Bản tin
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Smart Communication"
        title="Smart Mail Hub & Tóm tắt AI"
        description="Quản lý đồng thời nhiều tài khoản Gmail & Outlook trong một Unified Inbox duy nhất. Tự động tóm tắt TL;DR, phát hiện việc cần làm và chuyển hóa đơn thành chi tiêu 1-click."
        icon={<Mail className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw
                className={`h-4 w-4 ${syncAllMutation.isPending ? 'animate-spin' : ''}`}
              />
              <span>Đồng bộ tất cả</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Thêm Hòm Thư
            </button>
          </div>
        }
      />

      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tài khoản đã nối
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.totalAccounts || accounts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-500">
            🚨 Cần xử lý ngay
          </p>
          <p className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">
            {overview?.totalActionRequired || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            💳 Hóa đơn cần lưu
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overview?.totalFinanceBills || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Thư chưa đọc
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {overview?.totalUnread || 0}
          </p>
        </div>
      </div>

      {/* Main Mail Grid: 3 Panes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 min-h-[640px]">
        {/* Left Pane: Accounts & Smart Folders (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <SurfaceCard className="p-4 space-y-4">
            <div>
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Hòm thư kết nối
              </p>
              <div className="mt-2 space-y-1">
                {/* All Inboxes */}
                <button
                  type="button"
                  onClick={() => setSelectedAccountId('all')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                    selectedAccountId === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="h-4 w-4" />
                    <span>Tất cả hòm thư</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] ${
                      selectedAccountId === 'all'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {accounts.reduce((acc, a) => acc + a.unreadCount, 0)}
                  </span>
                </button>

                {/* Individual Accounts */}
                {accounts.map((acc) => {
                  const isSelected = selectedAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className={`group flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                        isSelected
                          ? 'bg-slate-200/80 text-slate-900 font-bold dark:bg-slate-800 dark:text-white'
                          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedAccountId(acc.id)}
                        className="flex items-center gap-2.5 overflow-hidden text-left flex-1"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: acc.color }}
                        />
                        <div className="truncate">
                          <p className="truncate text-xs font-bold leading-none">{acc.label}</p>
                          <p className="truncate text-[10px] text-slate-400 mt-0.5">{acc.email}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1">
                        {acc.unreadCount > 0 && (
                          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            {acc.unreadCount}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => syncAccountMutation.mutate(acc.id)}
                          title="Đồng bộ hòm thư này"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-indigo-600"
                        >
                          <RefreshCw className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAccountMutation.mutate(acc.id)}
                          title="Gỡ hòm thư"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart AI Categories */}
            <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
              <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Bộ lọc Thông Minh AI
              </p>
              <div className="mt-2 space-y-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('action_required')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'action_required'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Cần xử lý
                  </span>
                  <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/80 dark:text-red-300">
                    {overview?.totalActionRequired || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('finance')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'finance'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Hóa đơn & Tiền
                  </span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300">
                    {overview?.totalFinanceBills || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('work')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'work'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-purple-500" />
                    Công việc
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('newsletter')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'newsletter'
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-sky-500" />
                    Bản tin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Tất cả thư</span>
                </button>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Middle Pane: Email Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo người gửi, tiêu đề, tóm tắt..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[700px] pr-1">
            {messagesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải hộp thư...</div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                Không tìm thấy email nào phù hợp với bộ lọc.
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selectedMessageId === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedMessageId(msg.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition-all shadow-sm ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500 dark:bg-indigo-950/30'
                        : msg.isRead
                        ? 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                        : 'border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 ring-1 ring-indigo-100 dark:ring-indigo-950'
                    }`}
                  >
                    {/* Header: Account pill + Date + Star */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: msg.accountColor }}
                      >
                        {msg.accountLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(msg.receivedAt), 'dd/MM HH:mm')}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarMutation.mutate(msg.id);
                          }}
                          className="text-slate-300 hover:text-amber-400"
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${
                              msg.isStarred ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Sender & Subject */}
                    <p
                      className={`mt-2 truncate text-xs ${
                        msg.isRead
                          ? 'font-medium text-slate-700 dark:text-slate-300'
                          : 'font-black text-slate-900 dark:text-white'
                      }`}
                    >
                      {msg.fromName}
                    </p>
                    <p
                      className={`truncate text-xs ${
                        msg.isRead
                          ? 'text-slate-600 dark:text-slate-400'
                          : 'font-bold text-slate-900 dark:text-white'
                      }`}
                    >
                      {msg.subject}
                    </p>

                    {/* AI TL;DR Snippet */}
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                      {msg.aiSummary || msg.snippet}
                    </p>

                    {/* Bottom Badges */}
                    <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800/80">
                      {getCategoryBadge(msg.aiCategory)}
                      <div className="flex items-center gap-1 text-[10px]">
                        {msg.linkedTaskId && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-semibold">
                            ⚡ Task
                          </span>
                        )}
                        {msg.linkedTransactionId && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 font-semibold">
                            💵 Đã lưu
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: AI Email Inspector & Reader (5 cols) */}
        <div className="lg:col-span-5">
          {activeMessage ? (
            <SurfaceCard className="p-5 space-y-5 sticky top-20 max-h-[820px] overflow-y-auto">
              {/* Email Meta Header */}
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ backgroundColor: activeMessage.accountColor }}
                    >
                      {activeMessage.accountLabel}
                    </span>
                    {getCategoryBadge(activeMessage.aiCategory)}
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(new Date(activeMessage.receivedAt), 'PPP p')}
                  </span>
                </div>

                <h3 className="mt-2 text-base font-black text-slate-900 dark:text-white">
                  {activeMessage.subject}
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Từ: <strong>{activeMessage.fromName}</strong> &lt;{activeMessage.fromAddress}&gt;
                </p>
                <p className="text-[11px] text-slate-400">
                  Đến: {activeMessage.accountEmail}
                </p>
              </div>

              {/* 🌟 AI Executive Summary Box (TL;DR) */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-sky-50/50 p-4 shadow-sm dark:border-indigo-950 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    AI Tóm tắt nội dung (TL;DR)
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-800 dark:text-slate-200">
                  {activeMessage.aiSummary}
                </p>

                {/* Action Items List */}
                {activeMessage.aiActionItems && activeMessage.aiActionItems.length > 0 && (
                  <div className="mt-3 border-t border-indigo-100/80 pt-2.5 dark:border-indigo-950">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      🎯 Việc cần làm được AI phát hiện:
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {activeMessage.aiActionItems.map((act, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* ⚡ 1-Click Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => convertToTaskMutation.mutate(activeMessage.id)}
                  disabled={convertToTaskMutation.isPending || !!activeMessage.linkedTaskId}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  <span>
                    {activeMessage.linkedTaskId ? '✓ Đã chuyển thành Task' : '1-Click: Tạo Task'}
                  </span>
                </button>

                {activeMessage.aiCategory === 'finance' && (
                  <button
                    type="button"
                    onClick={() => convertToExpenseMutation.mutate(activeMessage.id)}
                    disabled={convertToExpenseMutation.isPending || !!activeMessage.linkedTransactionId}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>
                      {activeMessage.linkedTransactionId
                        ? '✓ Đã lưu chi tiêu'
                        : `1-Click: Lưu chi phí (${activeMessage.extractedAmount ? `$${activeMessage.extractedAmount}` : 'Hóa đơn'})`}
                    </span>
                  </button>
                )}
              </div>

              {/* AI Draft Reply Box */}
              {activeMessage.aiDraftReply && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      💬 Bản thảo trả lời nhanh do AI gợi ý:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReply(activeMessage.aiDraftReply)}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-slate-800"
                    >
                      {copiedReply ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Sao chép trả lời</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-xs text-slate-700 dark:text-slate-300 font-sans italic">
                    "{activeMessage.aiDraftReply}"
                  </p>
                </div>
              )}

              {/* Full Email Body Text */}
              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nội dung thư gốc
                </p>
                <div className="mt-2 whitespace-pre-wrap font-sans text-xs leading-6 text-slate-800 dark:text-slate-200">
                  {activeMessage.bodyText}
                </div>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Mail className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                Chọn một email để xem tóm tắt AI
              </h4>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                AI sẽ tự động đọc hiểu, tóm tắt ý chính và trích xuất hạn chót để bạn xử lý trong chớp mắt.
              </p>
            </SurfaceCard>
          )}
        </div>
      </div>

      <ConnectMailAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />
    </div>
  );
};

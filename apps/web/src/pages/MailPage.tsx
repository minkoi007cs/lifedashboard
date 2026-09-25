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
  GraduationCap,
  Tag,
  ShieldAlert,
  Cpu,
  X,
  Send,
} from 'lucide-react';
import { PageHeader, SurfaceCard } from '../components/ui/shell';
import { useToastStore } from '../store/toastStore';
import { ConnectMailAccountModal } from '../components/mail/ConnectMailAccountModal';
import { MultiAccountSetupWizardModal } from '../components/mail/MultiAccountSetupWizardModal';
import { McpServerModal } from '../components/mail/McpServerModal';
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
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isMcpOpen, setIsMcpOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<MailCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [copiedReply, setCopiedReply] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState<MailMessage | null>(null);

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

  const generateReplyMutation = useMutation({
    mutationFn: async ({ id, tone }: { id: string; tone: string }) =>
      api.post(`/api/v1/mail/messages/${id}/generate-reply`, { tone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mail-message-detail', selectedMessageId] });
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      showToast('AI đã tạo xong bản thảo trả lời phù hợp!', 'success');
    },
  });

  // Clean spam mutation
  const cleanSpamMutation = useMutation({
    mutationFn: async () => api.post('/api/v1/mail/clean-spam'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      showToast(`Đã dọn dẹp sạch ${res.data.deletedCount} thư rác & quảng cáo bằng AI!`, 'success');
    },
  });

  // Simulate Incoming Outlook Mail Mutation
  const simulateIncomingMutation = useMutation({
    mutationFn: async () =>
      api.post('/api/v1/mail/incoming/simulate', {
        provider: 'outlook',
        fromName: 'GS. Đặng Văn Nam (ĐH Bách Khoa)',
        fromAddress: 'nam.dang@hust.edu.vn',
        subject: '[ĐH Bách Khoa] Lịch bảo vệ Đề cương Đồ án Tốt nghiệp & Nộp Slide',
        bodyText:
          'Chào Khôi, Thầy gửi thông báo mới nhất về lịch bảo vệ đồ án tốt nghiệp đợt 1. Em chuẩn bị 10 slide thuyết trình và nộp bản in đề cương có chữ ký trước 17:00 ngày mai nhé. Chúc em chuẩn bị tốt!',
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      setIncomingAlert(res.data);
      setSelectedMessageId(res.data.id);
      showToast('🔔 Có email Outlook mới! AI đã đọc và tóm tắt ngay trên đầu trang.', 'info');
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
      case 'academic':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <GraduationCap className="h-3 w-3 text-blue-600 dark:text-blue-400" /> Học vấn
          </span>
        );
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
      case 'promotions':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            <Tag className="h-3 w-3 text-amber-600" /> Quảng cáo
          </span>
        );
      case 'spam':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <ShieldAlert className="h-3 w-3 text-rose-600" /> Thư rác
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Smart Communication & AI Copilot"
        title="Smart Mail Hub & Tóm tắt AI"
        description="Quản lý đồng thời nhiều tài khoản Google & Outlook trong một không gian duy nhất. Tích hợp MCP Server cho AI Agent, tự động đọc & tóm tắt email Outlook, lọc thư rác và phân loại học vấn."
        icon={<Mail className="h-6 w-6" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-Account Setup Wizard */}
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 px-3.5 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
            >
              <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>Thiết lập hàng loạt</span>
            </button>

            {/* MCP Server Button */}
            <button
              type="button"
              onClick={() => setIsMcpOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>MCP Server</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Simulate Incoming Outlook Mail */}
            <button
              type="button"
              onClick={() => simulateIncomingMutation.mutate()}
              disabled={simulateIncomingMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 disabled:opacity-50"
              title="Kích hoạt mô phỏng nhận một email mới từ Outlook để kiểm tra đọc & tóm tắt AI tự động"
            >
              <Send className={`h-3.5 w-3.5 ${simulateIncomingMutation.isPending ? 'animate-bounce' : ''}`} />
              <span>Thư Outlook mới</span>
            </button>

            {/* Clean Spam */}
            <button
              type="button"
              onClick={() => cleanSpamMutation.mutate()}
              disabled={cleanSpamMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-xs transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              title="Quét sạch thư rác & quảng cáo bằng AI"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Dọn thư rác</span>
            </button>

            {/* Sync All */}
            <button
              type="button"
              onClick={() => syncAllMutation.mutate()}
              disabled={syncAllMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncAllMutation.isPending ? 'animate-spin' : ''}`} />
              <span>Đồng bộ</span>
            </button>

            {/* Add single account */}
            <button
              type="button"
              onClick={() => setIsAddAccountOpen(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Thêm hòm thư
            </button>
          </div>
        }
      />

      {/* Top Metric Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Tài khoản đã nối
          </p>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.totalAccounts || accounts.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
            🎓 Học vấn & ĐH
          </p>
          <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
            {overview?.totalAcademic || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-red-500">
            🚨 Cần xử lý ngay
          </p>
          <p className="mt-1 text-2xl font-black text-red-600 dark:text-red-400">
            {overview?.totalActionRequired || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            💳 Hóa đơn chi tiêu
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {overview?.totalFinanceBills || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
            🗑️ Thư rác / Lừa đảo
          </p>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {overview?.totalSpam || 0}
          </p>
        </div>
      </div>

      {/* Main Mail Grid: 3 Panes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 min-h-[640px]">
        {/* Left Pane: Accounts & Smart Folders (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <SurfaceCard className="p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Hòm thư kết nối ({accounts.length})
                </p>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  + Thêm nhiều
                </button>
              </div>

              <div className="mt-2 space-y-1">
                {/* All Inboxes */}
                <button
                  type="button"
                  onClick={() => setSelectedAccountId('all')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition ${
                    selectedAccountId === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
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
                {/* Academic */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('academic')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'academic'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                    🎓 Học vấn & ĐH
                  </span>
                  <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/80 dark:text-blue-300">
                    {overview?.totalAcademic || 0}
                  </span>
                </button>

                {/* Action Required */}
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
                    🚨 Cần xử lý
                  </span>
                  <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/80 dark:text-red-300">
                    {overview?.totalActionRequired || 0}
                  </span>
                </button>

                {/* Work */}
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
                    💼 Công việc
                  </span>
                </button>

                {/* Finance */}
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
                    💳 Hóa đơn & Tiền
                  </span>
                  <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/80 dark:text-emerald-300">
                    {overview?.totalFinanceBills || 0}
                  </span>
                </button>

                {/* Promotions */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('promotions')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'promotions'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-amber-500" />
                    🏷️ Quảng cáo
                  </span>
                </button>

                {/* Spam */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('spam')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'spam'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    🗑️ Thư rác / Lừa đảo
                  </span>
                  <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-900/80 dark:text-rose-300">
                    {overview?.totalSpam || 0}
                  </span>
                </button>

                {/* All */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                    selectedCategory === 'all'
                      ? 'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Inbox className="h-4 w-4 text-slate-400" />
                    Tất cả thư
                  </span>
                </button>
              </div>
            </div>
          </SurfaceCard>
        </div>

        {/* Center Pane: Message Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thư, người gửi, chủ đề..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-slate-900 shadow-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Real-time Incoming Outlook Alert Banner */}
          {incomingAlert && (
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-indigo-500/10 p-4 shadow-sm animate-in fade-in dark:border-indigo-900/60 dark:from-indigo-950/40 dark:via-sky-950/40 dark:to-indigo-950/40">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-indigo-600 animate-ping mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        📬 Email mới từ {incomingAlert.fromName}
                      </p>
                      {getCategoryBadge(incomingAlert.aiCategory)}
                    </div>
                    <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 mt-1">
                      {incomingAlert.subject}
                    </p>
                    <div className="mt-1.5 rounded-xl border border-indigo-100 bg-white/70 p-2 text-[11px] text-slate-700 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 leading-relaxed">
                      <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">🤖 AI Tóm tắt: </strong>
                      {incomingAlert.aiSummary}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIncomingAlert(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Messages List */}
          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {messagesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Đang tải hộp thư...</div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400 dark:border-slate-800">
                Không tìm thấy email nào trong danh mục này.
              </div>
            ) : (
              messages.map((m) => {
                const isSelected = selectedMessageId === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMessageId(m.id)}
                    className={`cursor-pointer rounded-2xl border p-3.5 transition ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 shadow-xs dark:border-indigo-600 dark:bg-indigo-950/30'
                        : 'border-slate-200/70 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                    } ${!m.isRead ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: m.accountColor }}
                          title={m.accountLabel}
                        />
                        <span className="truncate text-xs text-slate-900 dark:text-white">
                          {m.fromName}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400 shrink-0">
                        {format(new Date(m.receivedAt), 'HH:mm')}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                      {m.subject}
                    </p>

                    <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      {m.snippet}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getCategoryBadge(m.aiCategory)}

                        {m.aiPriority === 'urgent' && (
                          <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                            GẤP
                          </span>
                        )}

                        {m.linkedTaskId && (
                          <span className="rounded-md bg-purple-50 px-1.5 py-0.5 text-[9px] font-bold text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                            ✓ Task
                          </span>
                        )}

                        {m.linkedTransactionId && (
                          <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                            $ Đã lưu
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarMutation.mutate(m.id);
                        }}
                        className={`p-1 transition ${
                          m.isStarred
                            ? 'text-amber-500'
                            : 'text-slate-300 hover:text-amber-400 dark:text-slate-600'
                        }`}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${m.isStarred ? 'fill-amber-500' : ''}`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: AI Inspector & Actions (5 cols) */}
        <div className="lg:col-span-5">
          {activeMessage ? (
            <SurfaceCard className="p-5 space-y-5 sticky top-6">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: activeMessage.accountColor }}
                    />
                    <span className="text-xs font-bold text-slate-500">
                      {activeMessage.accountLabel} ({activeMessage.provider.toUpperCase()})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {getCategoryBadge(activeMessage.aiCategory)}
                  </div>
                </div>

                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {activeMessage.subject}
                </h3>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                  <p>
                    Từ: <strong className="text-slate-700 dark:text-slate-300">{activeMessage.fromName}</strong> &lt;{activeMessage.fromAddress}&gt;
                  </p>
                  <span>{format(new Date(activeMessage.receivedAt), 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>

              {/* AI TL;DR Box */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-4 w-4" />
                  <span>AI TL;DR & Bóc tách hành động</span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {activeMessage.aiSummary}
                </p>

                {activeMessage.aiActionItems && activeMessage.aiActionItems.length > 0 && (
                  <div className="pt-2 border-t border-indigo-100/80 dark:border-indigo-900/40 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Việc cần làm (Action Items):
                    </p>
                    <ul className="space-y-1">
                      {activeMessage.aiActionItems.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                        >
                          <span className="text-indigo-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 1-Click Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Convert to Task */}
                {!activeMessage.linkedTaskId ? (
                  <button
                    type="button"
                    onClick={() => convertToTaskMutation.mutate(activeMessage.id)}
                    disabled={convertToTaskMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Biến thành Task LifeOS</span>
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-xl bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    <Check className="h-3.5 w-3.5" /> Đã tạo Task
                  </span>
                )}

                {/* Convert to Expense */}
                {activeMessage.aiCategory === 'finance' && (
                  <>
                    {!activeMessage.linkedTransactionId ? (
                      <button
                        type="button"
                        onClick={() => convertToExpenseMutation.mutate(activeMessage.id)}
                        disabled={convertToExpenseMutation.isPending}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition disabled:opacity-50"
                      >
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>Ghi chi tiêu ({activeMessage.extractedAmount || 49.99}$)</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Check className="h-3.5 w-3.5" /> Đã lưu Chi tiêu
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Email Content Body */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 max-h-56 overflow-y-auto">
                <p className="whitespace-pre-line text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">
                  {activeMessage.bodyText}
                </p>
              </div>

              {/* AI Reply Generator */}
              <div className="rounded-2xl border border-slate-200/80 p-4 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    Bản thảo trả lời bằng AI
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        generateReplyMutation.mutate({
                          id: activeMessage.id,
                          tone: activeMessage.aiCategory === 'academic' ? 'academic' : 'professional',
                        })
                      }
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {activeMessage.aiCategory === 'academic' ? '🎓 Giọng học thuật' : 'Chuyên nghiệp'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        generateReplyMutation.mutate({
                          id: activeMessage.id,
                          tone: 'quick_confirm',
                        })
                      }
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Xác nhận nhanh
                    </button>
                  </div>
                </div>

                {activeMessage.aiDraftReply ? (
                  <div className="relative rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
                    <p className="whitespace-pre-line leading-relaxed font-sans pr-8">
                      {activeMessage.aiDraftReply}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyReply(activeMessage.aiDraftReply)}
                      className="absolute right-2.5 top-2.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800"
                      title="Sao chép nội dung trả lời"
                    >
                      {copiedReply ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Bấm nút phía trên để AI tạo ngay bản nháp thư trả lời phù hợp với bối cảnh.
                  </p>
                )}
              </div>
            </SurfaceCard>
          ) : (
            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-400 dark:border-slate-800">
              <Mail className="h-10 w-10 text-slate-300 dark:text-slate-700" />
              <p className="mt-3 text-xs font-semibold">Chọn một email trong danh sách để xem chi tiết</p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
                Hệ thống AI sẽ tự động phân tích TL;DR, trích xuất việc cần làm và hỗ trợ tạo câu trả lời tức thì.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConnectMailAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
      />

      <MultiAccountSetupWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
      />

      <McpServerModal
        isOpen={isMcpOpen}
        onClose={() => setIsMcpOpen(false)}
      />
    </div>
  );
};

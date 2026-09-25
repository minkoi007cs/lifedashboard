import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Tag,
  CreditCard,
  Building,
  DollarSign,
  Users,
  Loader2,
  Calendar,
  Layers,
} from 'lucide-react';
import { ActionButton, SoftButton, SurfaceCard } from '../ui/shell';
import { useToastStore } from '../../store/toastStore';
import type {
  FinanceOverview,
  FinanceCategory,
  TransactionType,
  WalletType,
} from '@life-dashboard/shared';

export const PersonalFinanceDashboard: React.FC = () => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [isFamilyShared, setIsFamilyShared] = useState(false);
  const [txDate, setTxDate] = useState(() => new Date().toISOString().slice(0, 10));

  // Wallet form state
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('cash');
  const [walletBalance, setWalletBalance] = useState('');

  const { data: overview, isLoading } = useQuery<FinanceOverview>({
    queryKey: ['finance-overview'],
    queryFn: async () => (await api.get('/api/v1/finance/overview')).data,
  });

  const { data: categories = [] } = useQuery<FinanceCategory[]>({
    queryKey: ['finance-categories'],
    queryFn: async () => (await api.get('/api/v1/finance/categories')).data,
  });

  const createTxMutation = useMutation({
    mutationFn: async (payload: {
      amount: number;
      type: TransactionType;
      date: string;
      note?: string;
      walletId?: string;
      categoryId?: string;
      isFamilyShared: boolean;
    }) => api.post('/api/v1/finance/transactions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      setIsAddTxOpen(false);
      setAmount('');
      setNote('');
      showToast('Giao dịch đã được lưu thành công!', 'success');
    },
    onError: () => showToast('Không thể lưu giao dịch.', 'error'),
  });

  const deleteTxMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/v1/finance/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      showToast('Đã xóa giao dịch.', 'info');
    },
    onError: () => showToast('Không thể xóa giao dịch.', 'error'),
  });

  const createWalletMutation = useMutation({
    mutationFn: async (payload: { name: string; type: WalletType; balance: number }) =>
      api.post('/api/v1/finance/wallets', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      setIsAddWalletOpen(false);
      setWalletName('');
      setWalletBalance('');
      showToast('Tạo ví mới thành công!', 'success');
    },
    onError: () => showToast('Không thể tạo ví.', 'error'),
  });

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      showToast('Số tiền không hợp lệ.', 'error');
      return;
    }
    createTxMutation.mutate({
      amount: num,
      type: txType,
      date: txDate,
      note: note.trim() || undefined,
      walletId: selectedWalletId || (overview?.wallets[0]?.id ?? undefined),
      categoryId: selectedCategoryId || undefined,
      isFamilyShared,
    });
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) return;
    createWalletMutation.mutate({
      name: walletName.trim(),
      type: walletType,
      balance: parseFloat(walletBalance) || 0,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  const filteredCategories = categories.filter((c) => c.type === txType);

  return (
    <div className="space-y-6">
      {/* ── Top Summary Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SurfaceCard className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tổng tài sản (Net Worth)
              </p>
              <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(overview?.totalNetWorth || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Thu nhập tháng
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(overview?.monthlyIncome || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400">
                Chi tiêu tháng
              </p>
              <p className="mt-1 text-2xl font-black text-rose-500 dark:text-rose-400">
                -{formatCurrency(overview?.monthlyExpense || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="h-6 w-6" />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="relative overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Dòng tiền ròng (Cash Flow)
              </p>
              <p
                className={`mt-1 text-2xl font-black ${
                  (overview?.monthlyCashFlow || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {formatCurrency(overview?.monthlyCashFlow || 0)}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </SurfaceCard>
      </div>

      {/* ── Wallets & Accounts Section ──────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-500" />
            Tài khoản & Ví tiền ({overview?.wallets?.length || 0})
          </h3>
          <ActionButton onClick={() => setIsAddWalletOpen(true)} className="h-9 px-3 text-xs">
            <Plus className="h-4 w-4 mr-1" /> Thêm ví
          </ActionButton>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {overview?.wallets?.map((w) => (
            <SurfaceCard key={w.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  {w.type === 'bank' ? (
                    <Building className="h-5 w-5" />
                  ) : w.type === 'savings' ? (
                    <Layers className="h-5 w-5" />
                  ) : (
                    <Wallet className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{w.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {w.type} {w.isFamilyShared && '• Dùng chung'}
                  </p>
                </div>
              </div>
              <p className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrency(w.balance || 0)}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </div>

      {/* ── Actions Bar & Recent Transactions ───────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Transactions */}
        <div className="space-y-4 lg:col-span-8">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Giao dịch gần đây
            </h3>
            <ActionButton onClick={() => setIsAddTxOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Ghi giao dịch mới
            </ActionButton>
          </div>

          <SurfaceCard className="p-0 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview?.recentTransactions && overview.recentTransactions.length > 0 ? (
                overview.recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: tx.category?.color || '#f97316' }}
                      >
                        <Tag className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {tx.note || tx.category?.name || 'Giao dịch'}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-2">
                          <span>{tx.date}</span>
                          {tx.wallet && <span>• {tx.wallet.name}</span>}
                          {tx.isFamilyShared && (
                            <span className="inline-flex items-center gap-0.5 text-blue-500">
                              <Users className="h-3 w-3" /> Gia đình
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`text-base font-black ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-500 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </span>
                      <button
                        onClick={() => deleteTxMutation.mutate(tx.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        title="Xóa giao dịch"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-slate-400">
                  Chưa có giao dịch nào trong tháng này. Hãy bấm "Ghi giao dịch mới"!
                </div>
              )}
            </div>
          </SurfaceCard>
        </div>

        {/* Right: Category Breakdown & Budgets */}
        <div className="space-y-6 lg:col-span-4">
          <SurfaceCard className="p-5">
            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Cơ cấu chi tiêu theo danh mục
            </h4>
            <div className="space-y-3">
              {overview?.categoryBreakdown && overview.categoryBreakdown.length > 0 ? (
                overview.categoryBreakdown.map((item) => (
                  <div key={item.categoryName} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{item.categoryName}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatCurrency(item.amount)} ({item.percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-4">Chưa có dữ liệu chi tiêu</p>
              )}
            </div>
          </SurfaceCard>
        </div>
      </div>

      {/* ── Modal: Ghi giao dịch mới ────────────────────────────────────────── */}
      {isAddTxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-[hsl(var(--background))] p-6 shadow-2xl dark:border-white/10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Ghi giao dịch mới</h3>

            <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setTxType('expense')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                  txType === 'expense' ? 'bg-white shadow text-rose-500 dark:bg-slate-700' : 'text-slate-500'
                }`}
              >
                Chi tiêu (-)
              </button>
              <button
                type="button"
                onClick={() => setTxType('income')}
                className={`flex-1 rounded-xl py-2 text-sm font-bold transition ${
                  txType === 'income' ? 'bg-white shadow text-emerald-500 dark:bg-slate-700' : 'text-slate-500'
                }`}
              >
                Thu nhập (+)
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Số tiền (VND)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ví dụ: 50000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-lg font-bold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Ví / Nguồn tiền
                  </label>
                  <select
                    value={selectedWalletId}
                    onChange={(e) => setSelectedWalletId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {overview?.wallets?.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Danh mục
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Chọn danh mục...</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Ghi chú / Món đồ
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cà phê sáng, Mua rau củ..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Ngày giao dịch
                  </label>
                  <input
                    type="date"
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2.5">
                    <input
                      type="checkbox"
                      checked={isFamilyShared}
                      onChange={(e) => setIsFamilyShared(e.target.checked)}
                      className="rounded border-slate-300 text-orange-500 focus:ring-orange-400 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Chi tiêu chung gia đình
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <SoftButton type="button" onClick={() => setIsAddTxOpen(false)}>
                  Hủy
                </SoftButton>
                <ActionButton type="submit" disabled={createTxMutation.isPending}>
                  {createTxMutation.isPending ? 'Đang lưu...' : 'Lưu giao dịch'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Thêm ví mới ──────────────────────────────────────────────── */}
      {isAddWalletOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/40 bg-[hsl(var(--background))] p-6 shadow-2xl dark:border-white/10">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Thêm ví / Tài khoản mới</h3>
            <form onSubmit={handleCreateWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                  Tên ví
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Techcombank, Tiền mặt..."
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Loại tài khoản
                  </label>
                  <select
                    value={walletType}
                    onChange={(e) => setWalletType(e.target.value as WalletType)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="bank">Ngân hàng</option>
                    <option value="savings">Tiết kiệm</option>
                    <option value="credit">Thẻ tín dụng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
                    Số dư ban đầu (VND)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={walletBalance}
                    onChange={(e) => setWalletBalance(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-orange-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <SoftButton type="button" onClick={() => setIsAddWalletOpen(false)}>
                  Hủy
                </SoftButton>
                <ActionButton type="submit" disabled={createWalletMutation.isPending}>
                  {createWalletMutation.isPending ? 'Đang tạo...' : 'Tạo ví'}
                </ActionButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import {
  Search,
  CheckSquare,
  DollarSign,
  Utensils,
  Gift,
  LayoutDashboard,
  Mail,
  Share2,
  Target,
  Zap,
  Cloud,
  ArrowRight,
} from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenConnectedAccounts?: () => void;
}

type Mode = 'menu' | 'create-task' | 'create-expense' | 'create-meal';

export const CommandBar: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenConnectedAccounts,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('menu');
  const [inputValue, setInputValue] = useState('');
  const [amountValue, setAmountValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMode('menu');
      setQuery('');
      setInputValue('');
      setAmountValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) =>
      api.post('/api/v1/tasks', {
        title,
        priority: 'MEDIUM',
        status: 'TODO',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['daily-digest'] });
      showToast('Đã tạo task mới thành công!', 'success');
      onClose();
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async ({ amount, note }: { amount: number; note: string }) =>
      api.post('/api/v1/finance/transactions', {
        amount,
        note: note || 'Chi tiêu nhanh (Quick Capture)',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-overview'] });
      showToast('Đã ghi chép chi tiêu!', 'success');
      onClose();
    },
  });

  const createMealMutation = useMutation({
    mutationFn: async ({ name, calories }: { name: string; calories: number }) =>
      api.post('/api/v1/calories', {
        name,
        calories,
        mealType: 'snack',
        date: new Date().toISOString().split('T')[0],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calories'] });
      showToast('Đã ghi nhận bữa ăn!', 'success');
      onClose();
    },
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create-task' && inputValue.trim()) {
      createTaskMutation.mutate(inputValue.trim());
    } else if (mode === 'create-expense' && amountValue) {
      createExpenseMutation.mutate({
        amount: parseFloat(amountValue),
        note: inputValue.trim(),
      });
    } else if (mode === 'create-meal' && inputValue.trim()) {
      createMealMutation.mutate({
        name: inputValue.trim(),
        calories: parseInt(amountValue) || 200,
      });
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, shortcut: '1' },
    { label: 'Smart Mail Hub (Gmail & Outlook)', path: '/mail', icon: Mail, shortcut: 'M' },
    { label: 'Social Hub & Content Studio', path: '/social', icon: Share2, shortcut: 'S' },
    { label: 'Tasks (Nhiệm vụ)', path: '/tasks', icon: CheckSquare, shortcut: '2' },
    { label: 'Habits (Thói quen)', path: '/habits', icon: Zap, shortcut: '3' },
    { label: 'Focus Timer (Tập trung)', path: '/focus', icon: Target, shortcut: '4' },
    { label: 'Finance (Tài chính)', path: '/finance', icon: DollarSign, shortcut: '5' },
    { label: 'Calories & Dinh dưỡng', path: '/calories', icon: Utensils, shortcut: '6' },
    { label: 'Wishlist & Chia sẻ', path: '/wishlist', icon: Gift, shortcut: '7' },
  ];

  const quickActions = [
    {
      id: 'mail',
      label: '📬 Mở Hộp Thư Thông Minh (Mail Hub)',
      icon: Mail,
      shortcut: 'M',
      action: () => {
        navigate('/mail');
        onClose();
      },
    },
    {
      id: 'social',
      label: '📢 Lên Kế Hoạch Đăng Mạng Xã Hội (Social Hub)',
      icon: Share2,
      shortcut: 'S',
      action: () => {
        navigate('/social');
        onClose();
      },
    },
    {
      id: 'task',
      label: '⚡ Tạo Task mới...',
      icon: CheckSquare,
      shortcut: 'T',
      action: () => setMode('create-task'),
    },
    {
      id: 'expense',
      label: '💵 Ghi nhanh Chi tiêu...',
      icon: DollarSign,
      shortcut: 'E',
      action: () => setMode('create-expense'),
    },
    {
      id: 'meal',
      label: '🥗 Ghi nhanh Bữa ăn (Calo)...',
      icon: Utensils,
      shortcut: 'C',
      action: () => setMode('create-meal'),
    },
    {
      id: 'focus',
      label: '🎯 Bắt đầu phiên Pomodoro 25m',
      icon: Target,
      shortcut: 'F',
      action: () => {
        navigate('/focus');
        onClose();
      },
    },
    {
      id: 'hub',
      label: '☁️ Notification Hub (Gmail, GitHub)',
      icon: Cloud,
      shortcut: 'N',
      action: () => {
        onClose();
        onOpenConnectedAccounts?.();
      },
    },
  ];

  const filteredNav = navItems.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredActions = quickActions.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 p-4 pt-16 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="themed-surface relative w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'menu' ? (
          <div>
            {/* Search Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Gõ lệnh hoặc điều hướng... (VD: Task, Chi tiêu, Focus)"
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                ESC
              </span>
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto p-3 space-y-4">
              {/* Quick Actions */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Quick Capture & Actions
                </p>
                <div className="mt-1 space-y-1">
                  {filteredActions.map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={act.action}
                        className="group flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-indigo-400"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                          <span>{act.label}</span>
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          {act.shortcut}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Điều hướng nhanh
                </p>
                <div className="mt-1 space-y-1">
                  {filteredNav.map((nav) => {
                    const Icon = nav.icon;
                    return (
                      <button
                        key={nav.path}
                        type="button"
                        onClick={() => {
                          navigate(nav.path);
                          onClose();
                        }}
                        className="group flex w-full items-center justify-between rounded-2xl px-3.5 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700 dark:group-hover:text-slate-200" />
                          <span>{nav.label}</span>
                        </div>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          {nav.shortcut}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sub-forms for Quick Capture */
          <form onSubmit={handleActionSubmit} className="p-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {mode === 'create-task' && '⚡ Tạo Task mới'}
                {mode === 'create-expense' && '💵 Ghi nhận Chi tiêu nhanh'}
                {mode === 'create-meal' && '🥗 Ghi nhận Bữa ăn nhanh'}
              </span>
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Quay lại (Menu)
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {mode === 'create-task' && (
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Tên công việc cần làm..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              )}

              {mode === 'create-expense' && (
                <>
                  <input
                    autoFocus
                    type="number"
                    step="0.01"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    placeholder="Số tiền (VD: 50.00)"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ghi chú chi tiêu (tùy chọn)..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </>
              )}

              {mode === 'create-meal' && (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Tên món ăn (VD: Phở bò, Salad gà)..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    value={amountValue}
                    onChange={(e) => setAmountValue(e.target.value)}
                    placeholder="Ước tính Calories (VD: 450)"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Lưu ngay <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

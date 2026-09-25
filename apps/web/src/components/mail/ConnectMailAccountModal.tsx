import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { X, Mail, Check } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { CreateMailAccountDto, MailProvider } from '@life-dashboard/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const COLORS = [
  { label: 'Đỏ Gmail', hex: '#ea4335' },
  { label: 'Xanh Outlook', hex: '#0078d4' },
  { label: 'Tím Đậm', hex: '#8b5cf6' },
  { label: 'Xanh Ngọc', hex: '#0d9488' },
  { label: 'Cam Hổ Phách', hex: '#f59e0b' },
  { label: 'Hồng Fuchsia', hex: '#ec4899' },
];

export const ConnectMailAccountModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [provider, setProvider] = useState<MailProvider>('gmail');
  const [email, setEmail] = useState('');
  const [label, setLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);

  const connectMutation = useMutation({
    mutationFn: async (data: CreateMailAccountDto) =>
      api.post('/api/v1/mail/accounts', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      showToast(`Đã kết nối tài khoản ${res.data.email} thành công!`, 'success');
      onClose();
      setEmail('');
      setLabel('');
    },
    onError: () => {
      showToast('Không thể kết nối tài khoản mail. Vui lòng thử lại.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      showToast('Vui lòng nhập địa chỉ email', 'error');
      return;
    }
    connectMutation.mutate({
      provider,
      email: email.trim(),
      label: label.trim() || (provider === 'gmail' ? 'Gmail' : 'Outlook'),
      color: selectedColor,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="themed-surface relative w-full max-w-md rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Thêm Hòm Thư Mới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hỗ trợ nhiều tài khoản Gmail & Outlook đồng thời
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Provider Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dịch vụ Email
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setProvider('gmail');
                  setSelectedColor('#ea4335');
                }}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-3 text-xs font-bold transition-all ${
                  provider === 'gmail'
                    ? 'border-red-500 bg-red-50/70 text-red-700 shadow-sm dark:bg-red-950/40 dark:text-red-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500 text-[10px] font-black text-white">
                  M
                </span>
                Google Gmail
              </button>

              <button
                type="button"
                onClick={() => {
                  setProvider('outlook');
                  setSelectedColor('#0078d4');
                }}
                className={`flex items-center justify-center gap-2.5 rounded-2xl border p-3 text-xs font-bold transition-all ${
                  provider === 'outlook'
                    ? 'border-sky-500 bg-sky-50/70 text-sky-700 shadow-sm dark:bg-sky-950/40 dark:text-sky-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-600 text-[10px] font-black text-white">
                  O
                </span>
                Microsoft Outlook
              </button>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Địa chỉ Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: khoi.work@gmail.com hoặc corp@outlook.com"
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Custom Label */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tên gợi nhớ (Nhãn hòm thư)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="VD: Gmail Công ty, Outlook Khách hàng, Gmail Dự án..."
              className="mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-900 outline-none transition focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Màu đại diện
            </label>
            <div className="mt-2 flex items-center gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.label}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor === c.hex && (
                    <Check className="h-4 w-4 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {connectMutation.isPending ? 'Đang kết nối...' : 'Xác nhận Thêm Hòm Thư'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

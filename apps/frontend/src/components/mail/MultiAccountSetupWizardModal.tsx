import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { X, Plus, Trash2, Mail, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';
import type { CreateMailAccountDto, MailProvider } from '@life-dashboard/shared';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface AccountRow {
  id: string;
  provider: MailProvider;
  email: string;
  label: string;
  color: string;
}

const COLOR_PALETTE = [
  { name: 'Red', hex: '#ea4335' },
  { name: 'Blue', hex: '#0078d4' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Cyan', hex: '#06b6d4' },
];

export const MultiAccountSetupWizardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [accounts, setAccounts] = useState<AccountRow[]>([
    {
      id: '1',
      provider: 'gmail',
      email: '',
      label: 'Gmail Cá nhân',
      color: '#ea4335',
    },
    {
      id: '2',
      provider: 'outlook',
      email: '',
      label: 'Outlook Trường ĐH / Học tập',
      color: '#0078d4',
    },
    {
      id: '3',
      provider: 'outlook',
      email: '',
      label: 'Outlook Công ty / Công việc',
      color: '#10b981',
    },
  ]);

  const addRow = (provider: MailProvider = 'gmail') => {
    const isGmail = provider === 'gmail';
    const newId = Date.now().toString();
    setAccounts((prev) => [
      ...prev,
      {
        id: newId,
        provider,
        email: '',
        label: isGmail ? `Gmail Mới ${prev.length + 1}` : `Outlook Mới ${prev.length + 1}`,
        color: isGmail ? '#ea4335' : '#0078d4',
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (accounts.length <= 1) {
      showToast('Cần giữ lại ít nhất 1 tài khoản để thiết lập', 'info');
      return;
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const updateRow = (id: string, updates: Partial<AccountRow>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const batchMutation = useMutation({
    mutationFn: async (payload: CreateMailAccountDto[]) =>
      api.post('/api/v1/mail/accounts/batch', { accounts: payload }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['mail-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['mail-messages'] });
      queryClient.invalidateQueries({ queryKey: ['mail-overview'] });
      showToast(`Đã kết nối thành công ${res.data.length} tài khoản hòm thư!`, 'success');
      onClose();
    },
    onError: () => {
      showToast('Có lỗi xảy ra khi lưu tài khoản. Vui lòng kiểm tra lại thông tin.', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validAccounts = accounts.filter((a) => a.email.trim().length > 0);
    if (validAccounts.length === 0) {
      showToast('Vui lòng nhập địa chỉ email cho ít nhất 1 tài khoản', 'info');
      return;
    }

    const payload: CreateMailAccountDto[] = validAccounts.map((a) => ({
      provider: a.provider,
      email: a.email.trim(),
      label: a.label.trim() || (a.provider === 'gmail' ? 'Gmail' : 'Outlook'),
      color: a.color,
    }));

    batchMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="themed-surface relative w-full max-w-3xl overflow-hidden rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 transition-all max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Wizard Thiết Lập Hàng Loạt Hòm Thư
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                  Gmail & Outlook
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nhập tất cả tài khoản Google & Outlook của bạn cùng lúc để hệ thống đồng bộ và phân loại thông minh.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 dark:text-indigo-300 leading-relaxed">
              <strong className="font-semibold">Tính năng phân loại thông minh:</strong> Sau khi kết nối, AI sẽ tự động phân tách email học vấn (trường ĐH, giảng viên), công việc, hóa đơn tài chính, đồng thời lọc sạch thư rác và quảng cáo.
            </div>
          </div>

          <div className="space-y-3">
            {accounts.map((acc, index) => (
              <div
                key={acc.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {index + 1}
                    </span>

                    {/* Provider Toggle */}
                    <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(acc.id, {
                            provider: 'gmail',
                            color: '#ea4335',
                            label: acc.label.includes('Outlook') ? 'Gmail Cá nhân' : acc.label,
                          })
                        }
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          acc.provider === 'gmail'
                            ? 'bg-white text-red-600 shadow-xs dark:bg-slate-700 dark:text-red-400'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-[#ea4335]" />
                        Google (Gmail)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateRow(acc.id, {
                            provider: 'outlook',
                            color: '#0078d4',
                            label: acc.label.includes('Gmail') ? 'Outlook Trường ĐH' : acc.label,
                          })
                        }
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                          acc.provider === 'outlook'
                            ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-blue-400'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-[#0078d4]" />
                        MS Outlook
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRow(acc.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                    title="Xóa tài khoản này khỏi danh sách"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  {/* Email Input */}
                  <div className="sm:col-span-6">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      required
                      value={acc.email}
                      onChange={(e) => updateRow(acc.id, { email: e.target.value })}
                      placeholder={
                        acc.provider === 'gmail'
                          ? 'tenban@gmail.com'
                          : 'tenban@hust.edu.vn hoặc outlook.com'
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Label Input */}
                  <div className="sm:col-span-4">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tên Nhãn Hiển Thị
                    </label>
                    <input
                      type="text"
                      value={acc.label}
                      onChange={(e) => updateRow(acc.id, { label: e.target.value })}
                      placeholder="VD: Outlook Trường ĐH"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Color Picker */}
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Màu sắc
                    </label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => updateRow(acc.id, { color: color.hex })}
                          className={`h-5 w-5 rounded-full transition ${
                            acc.color === color.hex
                              ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-110'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add more buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => addRow('gmail')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-red-400 hover:text-red-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm tài khoản Gmail
            </button>
            <button
              type="button"
              onClick={() => addRow('outlook')}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" /> Thêm tài khoản Outlook
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Dữ liệu được lưu trữ mã hóa và cách ly theo tài khoản của bạn.</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Bỏ qua
              </button>
              <button
                type="submit"
                disabled={batchMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {batchMutation.isPending ? (
                  <span>Đang kết nối...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Lưu & Kết nối ({accounts.filter((a) => a.email.trim()).length}) Tài khoản</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatMoney } from '../../lib/format-money';
import { Save, Calculator, ClipboardList, Calendar, Tag, ChevronDown, ChevronUp, AlertCircle, Search, ArrowUpDown, Download, Upload, X } from 'lucide-react';
import { ActionButton, SurfaceCard, SoftButton } from '../ui/shell';
import { useToastStore } from '../../store/toastStore';
import type { FinanceSale, FinanceExpense, FinanceStats } from '@life-dashboard/shared';

type MoneyEntryType = 'income' | 'expense';
type SortBy = 'date' | 'income' | 'balance';

const TAX_RATE = 0.15;

const getErrorMessage = (err: unknown) => {
    if (typeof err === 'object' && err !== null) {
        const response = 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response
            : undefined;
        if (response?.data?.message) return response.data.message;

        const message = 'message' in err ? (err as { message?: string }).message : undefined;
        if (message) return message;
    }

    return 'Unknown error';
};

interface DailyEntryFormProps {
    targetUserId?: string;
    isReadOnly?: boolean;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({ targetUserId, isReadOnly = false }) => {
    const queryClient = useQueryClient();
    const showToast = useToastStore((state) => state.showToast);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Income fields
    const [serviceSales, setServiceSales] = useState(0);
    const [cashTips, setCashTips] = useState(0);
    
    // Expense fields
    const [expenseAmount, setExpenseAmount] = useState(0);
    const [expenseCategory, setExpenseCategory] = useState('Other');
    const [receiptImage, setReceiptImage] = useState<string | null>(null);
    
    // Common fields
    const [description, setDescription] = useState('');
    const [activeMoneyTab, setActiveMoneyTab] = useState<MoneyEntryType>('income');
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [sortBy, setSortBy] = useState<SortBy>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const toggleDayExpanded = (dayId: string) => {
        setExpandedDays(prev => ({
            ...prev,
            [dayId]: !prev[dayId]
        }));
    };

    // Query for recent entries
    const { data: stats, isLoading: isStatsLoading } = useQuery<FinanceStats>({
        queryKey: ['finance-stats', targetUserId ?? 'self'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/statistics', {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
    });

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingTransactionId(null);
        setDate(new Date().toISOString().split('T')[0]);
        setServiceSales(0);
        setCashTips(0);
        setExpenseAmount(0);
        setExpenseCategory('Other');
        setReceiptImage(null);
        setDescription('');
    };

    const handleDownloadCSV = () => {
        if (!stats) return;
        
        const headers = [
            'Date',
            'Type',
            'Description',
            'Category (Expenses)',
            'Check Income (Incomes)',
            'Cash Income (Incomes)',
            'Amount'
        ];
        
        const rows: string[][] = [];
        
        stats.sales.forEach(sale => {
            rows.push([
                sale.date,
                'Income',
                sale.description || '',
                '',
                sale.serviceSales.toFixed(2),
                sale.cashTips.toFixed(2),
                (sale.serviceSales + sale.cashTips).toFixed(2)
            ]);
        });
        
        stats.expenses.forEach(exp => {
            rows.push([
                exp.date || '',
                'Expense',
                exp.description || '',
                exp.category || '',
                '',
                '',
                exp.amount.toFixed(2)
            ]);
        });
        
        rows.sort((a, b) => b[0].localeCompare(a[0]));
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Granular transaction mutations
    const saveIncomeMutation = useMutation({
        mutationFn: async (data: { id?: string; date: string; serviceSales: number; cashTips: number; description?: string; receiptImage?: string | null }) => {
            const res = await api.post('/api/v1/finance/income', data, {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats', targetUserId ?? 'self'] });
            showToast(isEditing ? 'Income transaction updated!' : 'Income transaction saved!', 'success');
            handleCancelEdit();
        },
        onError: (err) => {
            showToast('Failed to save income: ' + getErrorMessage(err), 'error');
        }
    });

    const saveExpenseMutation = useMutation({
        mutationFn: async (data: { id?: string; date: string; amount: number; description: string; category?: string; receiptImage?: string | null }) => {
            const res = await api.post('/api/v1/finance/expense', data, {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats', targetUserId ?? 'self'] });
            showToast(isEditing ? 'Expense transaction updated!' : 'Expense transaction saved!', 'success');
            handleCancelEdit();
        },
        onError: (err) => {
            showToast('Failed to save expense: ' + getErrorMessage(err), 'error');
        }
    });

    const deleteIncomeMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/api/v1/finance/income/${id}`, {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats', targetUserId ?? 'self'] });
            showToast('Income transaction deleted successfully!', 'success');
        },
        onError: (err) => {
            showToast('Failed to delete income: ' + getErrorMessage(err), 'error');
        }
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/api/v1/finance/expense/${id}`, {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats', targetUserId ?? 'self'] });
            showToast('Expense transaction deleted successfully!', 'success');
        },
        onError: (err) => {
            showToast('Failed to delete expense: ' + getErrorMessage(err), 'error');
        }
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('File is too large. Please select an image under 5MB.', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                setReceiptImage(compressedBase64);
            };
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedDescription = description.trim();

        if (activeMoneyTab === 'income') {
            saveIncomeMutation.mutate({
                id: isEditing ? (editingTransactionId ?? undefined) : undefined,
                date,
                serviceSales,
                cashTips,
                description: trimmedDescription,
                receiptImage: receiptImage,
            });
        } else {
            if (expenseAmount <= 0) {
                showToast('Expense amount must be greater than 0.', 'warning');
                return;
            }
            saveExpenseMutation.mutate({
                id: isEditing ? (editingTransactionId ?? undefined) : undefined,
                date,
                amount: expenseAmount,
                description: trimmedDescription || 'Expense',
                category: expenseCategory,
                receiptImage: receiptImage,
            });
        }
    };

    const handleEditIncome = (sale: FinanceSale) => {
        setIsEditing(true);
        setEditingTransactionId(sale.id);
        setDate(sale.date);
        setServiceSales(sale.serviceSales);
        setCashTips(sale.cashTips);
        setReceiptImage(sale.receiptImage || null);
        setDescription(sale.description || '');
        setActiveMoneyTab('income');
        scrollToForm();
    };

    const handleEditExpense = (expense: FinanceExpense) => {
        setIsEditing(true);
        setEditingTransactionId(expense.id || null);
        setDate(expense.date || new Date().toISOString().split('T')[0]);
        setExpenseAmount(expense.amount);
        setExpenseCategory(expense.category || 'Other');
        setReceiptImage(expense.receiptImage || null);
        setDescription(expense.description || '');
        setActiveMoneyTab('expense');
        scrollToForm();
    };

    const scrollToForm = () => {
        const formElement = document.getElementById('daily-entry-form-title');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const sales = stats?.sales ?? [];
    const expensesList = stats?.expenses ?? [];

    // Collect all dates that have any transaction
    const allDates = Array.from(new Set([
        ...sales.map(s => s.date),
        ...expensesList.map(e => e.date).filter((d): d is string => !!d)
    ])).sort((a, b) => b.localeCompare(a));

    // Extract unique YYYY-MM
    const uniqueMonths = (() => {
        if (allDates.length === 0) return [];
        const months = allDates.map(d => d.substring(0, 7));
        const unique = Array.from(new Set(months)).sort((a, b) => b.localeCompare(a));
        return unique.map(m => {
            const [year, month] = m.split('-');
            const dateObj = new Date(Number(year), Number(month) - 1, 1);
            const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { value: m, label };
        });
    })();

    // Apply Filter & Search Logic to Dates
    const filteredDates = (() => {
        let list = [...allDates];

        // Filter by Month (YYYY-MM)
        if (selectedMonth !== 'all') {
            list = list.filter(d => d.startsWith(selectedMonth));
        }

        // Filter by Search Query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(d => {
                if (d.includes(query)) return true;

                const daySales = sales.filter(s => s.date === d);
                const hasMatchingSale = daySales.some(s => 
                    s.description?.toLowerCase().includes(query) ||
                    s.serviceSales.toString().includes(query) ||
                    s.cashTips.toString().includes(query)
                );
                if (hasMatchingSale) return true;

                const dayExpenses = expensesList.filter(e => e.date === d);
                const hasMatchingExpense = dayExpenses.some(e => 
                    e.description.toLowerCase().includes(query) ||
                    e.category?.toLowerCase().includes(query) ||
                    e.amount.toString().includes(query)
                );
                return hasMatchingExpense;
            });
        }

        // Apply custom sorting
        if (sortBy === 'income') {
            list.sort((a, b) => {
                const aIncome = sales.filter(s => s.date === a).reduce((sum, s) => sum + s.serviceSales + s.cashTips, 0);
                const bIncome = sales.filter(s => s.date === b).reduce((sum, s) => sum + s.serviceSales + s.cashTips, 0);
                return sortOrder === 'desc' ? bIncome - aIncome : aIncome - bIncome;
            });
        } else if (sortBy === 'balance') {
            list.sort((a, b) => {
                const aNet = sales.filter(s => s.date === a).reduce((sum, s) => sum + s.serviceSales * (1 - TAX_RATE) + s.cashTips, 0);
                const aExp = expensesList.filter(e => e.date === a).reduce((sum, e) => sum + e.amount, 0);
                const aBal = aNet - aExp;

                const bNet = sales.filter(s => s.date === b).reduce((sum, s) => sum + s.serviceSales * (1 - TAX_RATE) + s.cashTips, 0);
                const bExp = expensesList.filter(e => e.date === b).reduce((sum, e) => sum + e.amount, 0);
                const bBal = bNet - bExp;

                return sortOrder === 'desc' ? bBal - aBal : aBal - bBal;
            });
        } else {
            // date sorting
            list.sort((a, b) => {
                return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
            });
        }

        return list;
    })();

    const isPending = saveIncomeMutation.isPending || saveExpenseMutation.isPending;

    return (
        <div className="space-y-8">
            {!isReadOnly && <SurfaceCard>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isEditing && (
                        <div className="mb-4 p-4 rounded-2xl bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                                    ✏️ Editing transaction. Change details below.
                                </span>
                            </div>
                            <SoftButton 
                                type="button"
                                onClick={handleCancelEdit}
                                className="text-xs py-1 px-3 bg-white dark:bg-slate-800 hover:bg-gray-100"
                            >
                                Cancel Edit
                            </SoftButton>
                        </div>
                    )}

                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 id="daily-entry-form-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Calculator className="w-5 h-5 mr-2 text-pink-500" />
                            {isEditing ? 'Edit Transaction' : 'New Transaction'}
                        </h3>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description / Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white placeholder-gray-400 focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                            placeholder="Enter transaction notes or details..."
                        />
                    </div>

                    <div className="rounded-[28px] border border-orange-100 bg-orange-50/40 p-3 dark:border-white/10 dark:bg-slate-800/50">
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 dark:bg-slate-900/60">
                            <button
                                type="button"
                                disabled={isEditing && activeMoneyTab !== 'income'}
                                onClick={() => setActiveMoneyTab('income')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                    activeMoneyTab === 'income'
                                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                                        : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                disabled={isEditing && activeMoneyTab !== 'expense'}
                                onClick={() => setActiveMoneyTab('expense')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                                    activeMoneyTab === 'expense'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                Expense
                            </button>
                        </div>

                        <div className="mt-4 space-y-4">
                            {activeMoneyTab === 'income' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Check - Before Tax ($)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={serviceSales || ''}
                                            onChange={(e) => setServiceSales(Number(e.target.value))}
                                            className="w-full rounded-2xl border border-white bg-white/90 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-200 dark:focus:border-slate-700 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Income Cash ($)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={cashTips || ''}
                                            onChange={(e) => setCashTips(Number(e.target.value))}
                                            className="w-full rounded-2xl border border-white bg-white/90 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-200 dark:focus:border-slate-700 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Amount ($)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={expenseAmount || ''}
                                            onChange={(e) => setExpenseAmount(Number(e.target.value))}
                                            className="w-full rounded-2xl border border-white bg-white/90 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-red-200 dark:focus:border-slate-700 transition-colors"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                                        <select
                                            value={expenseCategory}
                                            onChange={(e) => setExpenseCategory(e.target.value)}
                                            className="w-full rounded-2xl border border-white bg-white/90 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-red-200 dark:focus:border-slate-700 transition-colors cursor-pointer"
                                        >
                                            <option value="Living / Transport">Living / Transport</option>
                                            <option value="Study / School">Study / School</option>
                                            <option value="Work">Work</option>
                                            <option value="Personal">Personal</option>
                                            <option value="Financial">Financial</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Receipt Image Evidence Upload Row (Common to both tabs) */}
                            <div className="pt-4 border-t border-orange-100/50 dark:border-slate-800 space-y-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Receipt Image Evidence
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <label className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        <Upload className="w-4 h-4 text-pink-500" />
                                        <span>{receiptImage ? 'Change Receipt' : 'Upload Receipt'}</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    {receiptImage && (
                                        <button
                                            type="button"
                                            onClick={() => setReceiptImage(null)}
                                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400 rounded-2xl transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" /> Clear Image
                                        </button>
                                    )}
                                </div>
                                {receiptImage && (
                                    <div className="relative mt-2 w-32 h-32 rounded-2xl overflow-hidden border border-orange-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-center p-1 shadow-sm">
                                        <img src={receiptImage} alt="Receipt Preview" className="max-w-full max-h-full object-contain rounded-xl" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {activeMoneyTab === 'income' && (
                            <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                                <div className="rounded-2xl bg-white/60 px-3 py-2 dark:bg-slate-900/50">
                                    Gross income: <span className="font-bold text-gray-900 dark:text-white">{formatMoney(serviceSales + cashTips)}</span>
                                </div>
                                <div className="rounded-2xl bg-white/60 px-3 py-2 dark:bg-slate-900/50">
                                    Tax estimate: <span className="font-bold text-amber-500">{formatMoney(serviceSales * TAX_RATE)}</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-2 rounded-2xl bg-white/60 px-3 py-2 text-xs text-gray-500 dark:bg-slate-900/50 dark:text-gray-400">
                            {activeMoneyTab === 'income' ? (
                                <>Net after tax: <span className="font-bold text-gray-900 dark:text-white">{formatMoney(serviceSales * (1 - TAX_RATE) + cashTips)}</span></>
                            ) : (
                                <>Expense value: <span className="font-bold text-red-500">{formatMoney(expenseAmount)}</span></>
                            )}
                        </div>
                    </div>
                    <ActionButton
                        type="submit"
                        disabled={isPending}
                        className="w-full"
                    >
                        {isPending ? 'Saving...' : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                {isEditing ? 'Update Transaction' : 'Save Transaction'}
                            </>
                        )}
                    </ActionButton>
                </form>
            </SurfaceCard>}

            {/* List of past daily detail entries and expenses */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
                        Transactions History & Ledgers
                    </h3>
                    <SoftButton
                        onClick={handleDownloadCSV}
                        className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs py-1.5 px-3 self-start sm:self-auto"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </SoftButton>
                </div>

                {/* Search and Filters Bar */}
                <div className="bg-white/80 dark:bg-slate-800/80 p-4 rounded-3xl border border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search in descriptions, values..."
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-2xl border border-orange-100/80 bg-orange-50/20 text-gray-900 placeholder-gray-400 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-300 dark:focus:border-slate-700 transition-colors"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Month Filter */}
                    <div className="relative">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-2 text-sm rounded-2xl border border-orange-100/80 bg-orange-50/20 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-300 dark:focus:border-slate-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="all">📅 All Months</option>
                            {uniqueMonths.map(m => (
                                <option key={m.value} value={m.value}>
                                    📅 {m.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Sort By Filter */}
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (value === 'date' || value === 'income' || value === 'balance') {
                                    setSortBy(value);
                                }
                            }}
                            className="w-full px-4 py-2 text-sm rounded-2xl border border-orange-100/80 bg-orange-50/20 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-300 dark:focus:border-slate-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="date">📅 Sort by Date</option>
                            <option value="income">💰 Sort by Income</option>
                            <option value="balance">📈 Sort by Net Balance</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </div>

                    {/* Sort Order Toggle */}
                    <SoftButton
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm rounded-2xl border border-orange-100/80 bg-orange-50/20 text-gray-900 dark:border-white/10 dark:bg-slate-900 dark:text-white hover:bg-orange-100/30 dark:hover:bg-slate-800/50 transition-all font-medium"
                    >
                        <span className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                            Order:
                        </span>
                        <span className="font-bold text-pink-600 dark:text-pink-400">
                            {sortOrder === 'desc' ? 'Desc ⬇️' : 'Asc ⬆️'}
                        </span>
                    </SoftButton>
                </div>

                {isStatsLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-28 animate-pulse rounded-3xl bg-white/60 dark:bg-slate-800/60 border border-gray-100 dark:border-gray-800"></div>
                        ))}
                    </div>
                ) : filteredDates.length === 0 ? (
                    <SurfaceCard className="border-dashed text-center py-10">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Matching Entries</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">We couldn't find any entries matching your filters. Try clearing your search.</p>
                    </SurfaceCard>
                ) : (
                    <div className="space-y-4">
                        {filteredDates.map((dateKey) => {
                            // Find sales and expenses for this date
                            const daySales = sales.filter(s => s.date === dateKey);
                            const dayExpenses = expensesList.filter(e => e.date === dateKey);
                            
                            const grossCheck = daySales.reduce((sum, s) => sum + s.serviceSales, 0);
                            const grossCash = daySales.reduce((sum, s) => sum + s.cashTips, 0);
                            const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                            
                            const netCheck = grossCheck * (1 - TAX_RATE);
                            const grossIncome = grossCheck + grossCash;
                            const netIncome = netCheck + grossCash;
                            const balance = netIncome - totalDayExpenses;
                            
                            const isExpanded = !!expandedDays[dateKey];
                            const totalTransactions = daySales.length + dayExpenses.length;

                            return (
                                <SurfaceCard key={dateKey} className="overflow-hidden p-0 border border-gray-100 dark:border-gray-800 shadow-sm">
                                    {/* Collapsible Date Header */}
                                    <div 
                                        onClick={() => toggleDayExpanded(dateKey)}
                                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="font-bold text-gray-900 dark:text-white">{dateKey}</span>
                                                <span className="text-xs font-semibold px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                                    {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Summary of {daySales.length} income(s) and {dayExpenses.length} expense(s)
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6">
                                            <div className="grid grid-cols-3 gap-6 text-right">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gross In</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(grossIncome)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Expenses</p>
                                                    <p className="text-sm font-bold text-red-500">{formatMoney(totalDayExpenses)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Net Bal</p>
                                                    <p className={`text-sm font-extrabold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {formatMoney(balance)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Detail Panel */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-slate-900/10 p-5 space-y-4">
                                            
                                            {/* List of granular income items */}
                                            {daySales.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                                                        <Calculator className="w-3.5 h-3.5" /> Income Transactions
                                                    </span>
                                                    <div className="space-y-2">
                                                        {daySales.map((sale) => {
                                                            const checkVal = sale.serviceSales || 0;
                                                            const cashVal = sale.cashTips || 0;
                                                            const netVal = checkVal * (1 - TAX_RATE) + cashVal;
                                                            return (
                                                                <div key={sale.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800/30 px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                                                                    <div className="flex items-center gap-3">
                                                                        {sale.receiptImage && (
                                                                            <div 
                                                                                onClick={() => setPreviewImage(sale.receiptImage || null)}
                                                                                className="w-10 h-10 rounded-xl overflow-hidden border border-orange-100 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex-shrink-0 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-pink-500/50 transition-all shadow-sm"
                                                                                title="Click to view full receipt"
                                                                            >
                                                                                <img src={sale.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover" />
                                                                            </div>
                                                                        )}
                                                                        <div className="space-y-1">
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                                                    Check: <span className="text-blue-500">{formatMoney(checkVal)}</span> | Cash: <span className="text-emerald-500">{formatMoney(cashVal)}</span>
                                                                                </span>
                                                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full">
                                                                                    Net: {formatMoney(netVal)}
                                                                                </span>
                                                                            </div>
                                                                            {sale.description && (
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{sale.description}"</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {!isReadOnly && (
                                                                        <div className="flex items-center gap-2 self-end md:self-auto">
                                                                            <button 
                                                                                onClick={() => handleEditIncome(sale)}
                                                                                className="text-xs font-bold px-3 py-1.5 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition-all"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    if (window.confirm('Delete this income transaction?')) {
                                                                                        deleteIncomeMutation.mutate(sale.id);
                                                                                    }
                                                                                }}
                                                                                className="text-xs font-bold px-3 py-1.5 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* List of granular expense items */}
                                            {dayExpenses.length > 0 && (
                                                <div className="space-y-2 pt-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1">
                                                        <Tag className="w-3.5 h-3.5" /> Expense Transactions
                                                    </span>
                                                    <div className="space-y-2">
                                                         {dayExpenses.map((exp) => (
                                                             <div key={exp.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-800/30 px-4 py-3 rounded-2xl border border-gray-100 dark:border-slate-800/50">
                                                                 <div className="flex items-center gap-3">
                                                                     {exp.receiptImage && (
                                                                         <div 
                                                                             onClick={() => setPreviewImage(exp.receiptImage || null)}
                                                                             className="w-10 h-10 rounded-xl overflow-hidden border border-orange-100 dark:border-slate-700 bg-white dark:bg-slate-900/50 flex-shrink-0 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-pink-500/50 transition-all shadow-sm"
                                                                             title="Click to view full receipt"
                                                                         >
                                                                             <img src={exp.receiptImage} alt="Receipt Thumbnail" className="w-full h-full object-cover" />
                                                                         </div>
                                                                     )}
                                                                     <div className="space-y-1">
                                                                         <div className="flex flex-wrap items-center gap-2">
                                                                             <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{exp.description}</span>
                                                                             {exp.category && (
                                                                                 <span className="text-[10px] font-bold px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                                                                     {exp.category}
                                                                                 </span>
                                                                             )}
                                                                         </div>
                                                                         <p className="text-sm font-bold text-red-500">{formatMoney(exp.amount)}</p>
                                                                     </div>
                                                                 </div>
                                                                    
                                                                    {!isReadOnly && (
                                                                        <div className="flex items-center gap-2 self-end md:self-auto">
                                                                            <button 
                                                                                onClick={() => handleEditExpense(exp)}
                                                                                className="text-xs font-bold px-3 py-1.5 border border-blue-100 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-xl transition-all"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    if (window.confirm('Delete this expense transaction?')) {
                                                                                        deleteExpenseMutation.mutate(exp.id || '');
                                                                                    }
                                                                                }}
                                                                                className="text-xs font-bold px-3 py-1.5 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </SurfaceCard>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Receipt Modal Preview */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-pointer"
                    onClick={() => setPreviewImage(null)}
                >
                    <div 
                        className="relative max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl border border-gray-100 dark:border-slate-800 cursor-default"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 hover:text-gray-700 dark:text-gray-300 transition-colors z-10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <img 
                            src={previewImage} 
                            alt="Receipt Preview" 
                            className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-sm"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

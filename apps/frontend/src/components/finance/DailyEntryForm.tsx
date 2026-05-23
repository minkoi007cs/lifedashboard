import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatMoney } from '../../lib/format-money';
import { Trash2, Save, Calculator, ClipboardList, Calendar, Tag, ChevronDown, ChevronUp, AlertCircle, Edit3, Search, ArrowUpDown, Download } from 'lucide-react';
import { ActionButton, SurfaceCard, SoftButton } from '../ui/shell';

interface Expense {
    id?: string;
    description: string;
    amount: number;
    category?: string;
    date?: string;
}

interface Sale {
    id: string;
    serviceSales: number;
    cashTips: number;
    date: string;
    description?: string;
}

interface StatsData {
    totalExpenses: number;
    totalRealProfit: number;
    sales: Sale[];
    expenses: Expense[];
}

type DailyEntryPayload = {
    date: string;
    serviceSales: number;
    cashTips: number;
    description?: string;
    originalDate?: string;
    expenses: Expense[];
};

type MoneyEntryType = 'income' | 'expense';
type SortBy = 'date' | 'income' | 'balance';

const TAX_RATE = 0.15;
const getCheckIncome = (sale: Sale) => sale.serviceSales || 0;
const getCashIncome = (sale: Sale) => sale.cashTips || 0;
const getTaxAmount = (sale: Sale) => getCheckIncome(sale) * TAX_RATE;
const getNetIncome = (sale: Sale) => getCheckIncome(sale) - getTaxAmount(sale) + getCashIncome(sale);
const getGrossIncome = (sale: Sale) => getCheckIncome(sale) + getCashIncome(sale);

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

export const DailyEntryForm: React.FC = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceSales, setServiceSales] = useState(0);
    const [cashTips, setCashTips] = useState(0);
    const [expenseAmount, setExpenseAmount] = useState(0);
    const [description, setDescription] = useState('');
    const [activeMoneyTab, setActiveMoneyTab] = useState<MoneyEntryType>('income');
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [originalDate, setOriginalDate] = useState('');
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
    const { data: stats, isLoading: isStatsLoading } = useQuery<StatsData>({
        queryKey: ['finance-stats'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/statistics');
            return res.data;
        },
    });

    const handleCancelEdit = () => {
        setIsEditing(false);
        setOriginalDate('');
        setDate(new Date().toISOString().split('T')[0]);
        setServiceSales(0);
        setCashTips(0);
        setExpenseAmount(0);
        setDescription('');
        setActiveMoneyTab('income');
    };

    const handleDownloadCSV = () => {
        if (!filteredSales || filteredSales.length === 0) {
            alert('No history entries to export.');
            return;
        }

        // CSV Headers
        const headers = [
            'Date',
            'Income Check Before Tax ($)',
            'Income Cash ($)',
            'Tax ($)',
            'Gross Income ($)',
            'Net Income After Tax ($)',
            'Total Expenses ($)',
            'Balance ($)',
            'Description',
            'Expense Details'
        ];

        // Format rows
        const rows = filteredSales.map(sale => {
            const dayExpenses = stats?.expenses?.filter(e => e.date === sale.date) || [];
            const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const grossIncome = getGrossIncome(sale);
            const netIncome = getNetIncome(sale);
            const balance = netIncome - totalDayExpenses;
            const expenseDetails = dayExpenses.map(e => `${e.description} (${formatMoney(e.amount)})`).join('; ');

            return [
                sale.date,
                sale.serviceSales.toFixed(2),
                sale.cashTips.toFixed(2),
                getTaxAmount(sale).toFixed(2),
                grossIncome.toFixed(2),
                netIncome.toFixed(2),
                totalDayExpenses.toFixed(2),
                balance.toFixed(2),
                sale.description ? `"${sale.description.replace(/"/g, '""')}"` : '',
                expenseDetails ? `"${expenseDetails.replace(/"/g, '""')}"` : ''
            ];
        });

        // Construct CSV content with UTF-8 BOM
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Trigger file download
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        
        // Construct filename: e.g. finance_history_all.csv or finance_history_2026-05.csv
        const filename = selectedMonth === 'all' 
            ? 'finance_history_all.csv' 
            : `finance_history_${selectedMonth}.csv`;
            
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const mutation = useMutation({
        mutationFn: async (data: DailyEntryPayload) => {
            const res = await api.post('/api/v1/finance/daily-entry', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            alert(isEditing ? 'Daily entry updated successfully!' : 'Daily entry saved successfully!');
            handleCancelEdit();
        },
        onError: (err) => {
            alert('Failed to save daily entry: ' + getErrorMessage(err));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (dateToDelete: string) => {
            const res = await api.delete(`/api/v1/finance/daily-entry/${dateToDelete}`);
            return res.data;
        },
        onSuccess: (_, deletedDate) => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            alert('Daily entry deleted successfully!');
            if (isEditing && originalDate === deletedDate) {
                handleCancelEdit();
            }
        },
        onError: (err) => {
            alert('Failed to delete daily entry: ' + getErrorMessage(err));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedDescription = description.trim();
        const expenses = expenseAmount > 0
            ? [{ description: trimmedDescription || 'Daily expense', amount: expenseAmount }]
            : [];

        mutation.mutate({
            date,
            serviceSales,
            cashTips,
            description: trimmedDescription,
            originalDate: isEditing ? originalDate : undefined,
            expenses,
        });
    };

    const handleEditClick = (sale: Sale, dayExpenses: Expense[]) => {
        setDate(sale.date);
        setServiceSales(sale.serviceSales);
        setCashTips(sale.cashTips);
        setDescription(sale.description || '');
        setExpenseAmount(dayExpenses.reduce((sum, expense) => sum + expense.amount, 0));
        setActiveMoneyTab(dayExpenses.length > 0 && sale.serviceSales === 0 && sale.cashTips === 0 ? 'expense' : 'income');
        setIsEditing(true);
        setOriginalDate(sale.date);

        // Scroll smoothly to form container
        const formElement = document.getElementById('daily-entry-form-title');
        if (formElement) {
            formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const sales = stats?.sales ?? [];
    const statExpenses = stats?.expenses ?? [];

    // Extract unique YYYY-MM from sales
    const uniqueMonths = (() => {
        if (sales.length === 0) return [];
        const months = sales.map(s => s.date.substring(0, 7)); // e.g. "2026-05"
        const unique = Array.from(new Set(months)).sort((a, b) => b.localeCompare(a));
        return unique.map(m => {
            const [year, month] = m.split('-');
            const dateObj = new Date(Number(year), Number(month) - 1, 1);
            const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { value: m, label };
        });
    })();

    // Apply Filter & Search Logic
    const filteredSales = (() => {
        if (sales.length === 0) return [];

        let list = [...sales];

        // Filter by Month (YYYY-MM)
        if (selectedMonth !== 'all') {
            list = list.filter(s => s.date.startsWith(selectedMonth));
        }

        // Filter by Search Query (matches description, values, expense details)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            list = list.filter(sale => {
                // Match sale description
                if (sale.description?.toLowerCase().includes(query)) return true;
                
                // Match sale date
                if (sale.date.includes(query)) return true;

                // Match money amounts
                const grossIncome = getGrossIncome(sale);
                const netIncome = getNetIncome(sale);
                
                const dayExpenses = statExpenses.filter(e => e.date === sale.date);
                const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                const balance = netIncome - totalDayExpenses;

                if (
                    sale.serviceSales.toString().includes(query) ||
                    sale.cashTips.toString().includes(query) ||
                    getTaxAmount(sale).toFixed(2).includes(query) ||
                    grossIncome.toFixed(2).includes(query) ||
                    netIncome.toFixed(2).includes(query) ||
                    balance.toFixed(2).includes(query)
                ) return true;

                // Match associated expenses
                const matchesExpense = dayExpenses.some(exp => 
                    exp.description.toLowerCase().includes(query) ||
                    (exp.category && exp.category.toLowerCase().includes(query)) ||
                    exp.amount.toString().includes(query)
                );

                return matchesExpense;
            });
        }

        // Apply custom sorting
        list.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'date') {
                comparison = a.date.localeCompare(b.date);
            } else if (sortBy === 'income') {
                const aIncome = getGrossIncome(a);
                const bIncome = getGrossIncome(b);
                comparison = aIncome - bIncome;
                if (comparison === 0) {
                    comparison = a.date.localeCompare(b.date);
                }
            } else if (sortBy === 'balance') {
                const aExpenses = statExpenses.filter(e => e.date === a.date).reduce((sum, e) => sum + e.amount, 0);
                const bExpenses = statExpenses.filter(e => e.date === b.date).reduce((sum, e) => sum + e.amount, 0);
                const aBalance = getNetIncome(a) - aExpenses;
                const bBalance = getNetIncome(b) - bExpenses;
                comparison = aBalance - bBalance;
                if (comparison === 0) {
                    comparison = a.date.localeCompare(b.date);
                }
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return list;
    })();

    return (
        <div className="space-y-8">
            <SurfaceCard>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {isEditing && (
                        <div className="mb-4 p-4 rounded-2xl bg-orange-100/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                                    ✏️ Editing entry. Change details or date below.
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
                            {isEditing ? 'Edit Daily Entry' : 'Daily Entry'}
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
                            placeholder="One shared note for this daily entry, income, and expense..."
                        />
                    </div>

                    <div className="rounded-[28px] border border-orange-100 bg-orange-50/40 p-3 dark:border-white/10 dark:bg-slate-800/50">
                        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white/70 p-1 dark:bg-slate-900/60">
                            <button
                                type="button"
                                onClick={() => setActiveMoneyTab('income')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeMoneyTab === 'income'
                                        ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-slate-950'
                                        : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                Income
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveMoneyTab('expense')}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                    activeMoneyTab === 'expense'
                                        ? 'bg-red-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:bg-white dark:text-gray-300 dark:hover:bg-slate-800'
                                }`}
                            >
                                Expense
                            </button>
                        </div>

                        <div className="mt-4">
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
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
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
                                    <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-gray-500 dark:bg-slate-900/60 dark:text-gray-300">
                                        Uses the shared description above.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white/60 px-3 py-2 dark:bg-slate-900/50">
                                Gross income: <span className="font-bold text-gray-900 dark:text-white">{formatMoney(serviceSales + cashTips)}</span>
                            </div>
                            <div className="rounded-2xl bg-white/60 px-3 py-2 dark:bg-slate-900/50">
                                Tax estimate: <span className="font-bold text-amber-500">{formatMoney(serviceSales * TAX_RATE)}</span>
                            </div>
                        </div>
                        <div className="mt-2 rounded-2xl bg-white/60 px-3 py-2 text-xs text-gray-500 dark:bg-slate-900/50 dark:text-gray-400">
                            Net after tax and expenses: <span className="font-bold text-gray-900 dark:text-white">{formatMoney(serviceSales - serviceSales * TAX_RATE + cashTips - expenseAmount)}</span>
                        </div>
                    </div>
                    <ActionButton
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full"
                    >
                        {mutation.isPending ? 'Saving...' : (
                            <>
                                <Save className="w-5 h-5 mr-2" />
                                {isEditing ? 'Update Daily Entry' : 'Save Daily Entry'}
                            </>
                        )}
                    </ActionButton>
                </form>
            </SurfaceCard>

            {/* List of past daily detail entries and expenses */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                        <ClipboardList className="w-5 h-5 mr-2 text-blue-500" />
                        Daily Entry History & Expenses
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
                            placeholder="Search by amount, note, expense..."
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
                            <option value="balance">📈 Sort by Balance</option>
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
                ) : filteredSales.length === 0 ? (
                    <SurfaceCard className="border-dashed text-center py-10">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No Matching Entries</h4>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">We couldn't find any entries matching your filters. Try clearing your search.</p>
                    </SurfaceCard>
                ) : (
                    <div className="space-y-4">
                        {filteredSales.map((sale) => {
                            // Find matching expenses
                            const dayExpenses = stats?.expenses?.filter(e => e.date === sale.date) || [];
                            const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                            const grossIncome = getGrossIncome(sale);
                            const netIncome = getNetIncome(sale);
                            const balance = netIncome - totalDayExpenses;
                            const isExpanded = !!expandedDays[sale.id];

                            return (
                                <SurfaceCard key={sale.id} className="overflow-hidden p-0 border border-gray-100 dark:border-gray-800">
                                    {/* Summary Header */}
                                    <div 
                                        onClick={() => toggleDayExpanded(sale.id)}
                                        className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-500" />
                                                <span className="font-bold text-gray-900 dark:text-white">{sale.date}</span>
                                                {dayExpenses.length > 0 && (
                                                    <span className="text-xs font-semibold px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-full">
                                                        {dayExpenses.length} expense{dayExpenses.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600 dark:text-gray-300 max-w-lg">
                                                {sale.description && (
                                                    <p className="italic truncate">"{sale.description}"</p>
                                                )}
                                                {dayExpenses.length > 0 && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                                        <span className="font-semibold text-pink-500">Expenses:</span>{' '}
                                                        <span>{dayExpenses.map(e => `${e.description} (${formatMoney(e.amount)})`).join(', ')}</span>
                                                    </p>
                                                )}
                                                {!sale.description && dayExpenses.length === 0 && (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs">No notes or expenses for this entry</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between md:justify-end gap-6">
                                            <div className="grid grid-cols-3 gap-6 text-right">
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Income</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{formatMoney(grossIncome)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Expenses</p>
                                                    <p className="text-sm font-bold text-red-500">{formatMoney(totalDayExpenses)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Balance</p>
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
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Income Check</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">{formatMoney(sale.serviceSales)}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Income Cash</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">{formatMoney(sale.cashTips)}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tax</span>
                                                    <span className="text-base font-bold text-amber-500">{formatMoney(getTaxAmount(sale))}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Net Income</span>
                                                    <span className="text-base font-bold text-blue-500">{formatMoney(netIncome)}</span>
                                                </div>
                                            </div>

                                            {dayExpenses.length > 0 && (
                                                <div className="space-y-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center">
                                                        <Tag className="w-3.5 h-3.5 mr-1 text-pink-500" /> Itemized Expenses
                                                    </span>
                                                    <div className="space-y-2">
                                                        {dayExpenses.map((exp, idx) => (
                                                            <div key={exp.id || idx} className="flex justify-between items-center bg-white dark:bg-slate-800/30 px-4 py-2.5 rounded-xl border border-gray-50 dark:border-slate-800/50">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-pink-500"></div>
                                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{exp.description}</span>
                                                                    {exp.category && (
                                                                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-full">
                                                                            {exp.category}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <span className="text-sm font-bold text-red-500">{formatMoney(exp.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/80 flex justify-between items-center">
                                                <SoftButton
                                                    onClick={() => {
                                                        if (window.confirm(`Are you sure you want to delete this entry and all expenses for ${sale.date}?`)) {
                                                            deleteMutation.mutate(sale.date);
                                                        }
                                                    }}
                                                    disabled={deleteMutation.isPending}
                                                    className="flex items-center gap-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Delete Entry
                                                </SoftButton>
                                                <SoftButton
                                                    onClick={() => handleEditClick(sale, dayExpenses)}
                                                    className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                >
                                                    <Edit3 className="w-4 h-4" /> Edit this Entry
                                                </SoftButton>
                                            </div>
                                        </div>
                                    )}
                                </SurfaceCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Trash2, Save, Calculator, ClipboardList, Calendar, Tag, ChevronDown, ChevronUp, AlertCircle, Edit3, Search, ArrowUpDown, Download } from 'lucide-react';
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
    ccTips: number;
    commissionBase: number;
    cashCommission: number;
    checkCommission: number;
    taxAmount: number;
    netCheck: number;
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
    ccTips: number;
    description?: string;
    originalDate?: string;
    expenses: Expense[];
};

export const DailyEntryForm: React.FC = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceSales, setServiceSales] = useState(0);
    const [cashTips, setCashTips] = useState(0);
    const [ccTips, setCcTips] = useState(0);
    const [description, setDescription] = useState('');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [originalDate, setOriginalDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [sortBy, setSortBy] = useState<'date' | 'gross' | 'profit'>('date');
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

    const addExpense = () => {
        setExpenses([...expenses, { description: '', amount: 0 }]);
    };

    const removeExpense = (index: number) => {
        setExpenses(expenses.filter((_, i) => i !== index));
    };

    const updateExpense = (index: number, field: keyof Expense, value: string | number) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], [field]: value };
        setExpenses(newExpenses);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setOriginalDate('');
        setDate(new Date().toISOString().split('T')[0]);
        setServiceSales(0);
        setCashTips(0);
        setCcTips(0);
        setDescription('');
        setExpenses([]);
    };

    const handleDownloadCSV = () => {
        if (!filteredSales || filteredSales.length === 0) {
            alert('No history entries to export.');
            return;
        }

        // CSV Headers
        const headers = [
            'Date',
            'Service Sales ($)',
            'Cash Tips ($)',
            'CC Tips ($)',
            'Gross Earnings ($)',
            'Net Paycheck ($)',
            'Total Expenses ($)',
            'Net Profit ($)',
            'Description',
            'Expense Details'
        ];

        // Format rows
        const rows = filteredSales.map(sale => {
            const dayExpenses = stats?.expenses?.filter(e => e.date === sale.date) || [];
            const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
            const gross = sale.commissionBase + sale.cashTips;
            const netPayout = sale.cashCommission + sale.netCheck + sale.cashTips;
            const realProfit = netPayout - totalDayExpenses;
            const expenseDetails = dayExpenses.map(e => `${e.description} ($${e.amount})`).join('; ');

            return [
                sale.date,
                sale.serviceSales.toFixed(2),
                sale.cashTips.toFixed(2),
                sale.ccTips.toFixed(2),
                gross.toFixed(2),
                sale.netCheck.toFixed(2),
                totalDayExpenses.toFixed(2),
                realProfit.toFixed(2),
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
            queryClient.invalidateQueries({ queryKey: ['active-pay-period'] });
            alert(isEditing ? 'Daily entry updated successfully!' : 'Daily entry saved successfully!');
            handleCancelEdit();
        },
        onError: (err: any) => {
            alert('Failed to save daily entry: ' + (err.response?.data?.message || err.message));
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (dateToDelete: string) => {
            const res = await api.delete(`/api/v1/finance/daily-entry/${dateToDelete}`);
            return res.data;
        },
        onSuccess: (_, deletedDate) => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['active-pay-period'] });
            alert('Daily entry deleted successfully!');
            if (isEditing && originalDate === deletedDate) {
                handleCancelEdit();
            }
        },
        onError: (err: any) => {
            alert('Failed to delete daily entry: ' + (err.response?.data?.message || err.message));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            date,
            serviceSales,
            cashTips,
            ccTips,
            description,
            originalDate: isEditing ? originalDate : undefined,
            expenses,
        });
    };

    const handleEditClick = (sale: Sale, dayExpenses: Expense[]) => {
        setDate(sale.date);
        setServiceSales(sale.serviceSales);
        setCashTips(sale.cashTips);
        setCcTips(sale.ccTips);
        setDescription(sale.description || '');
        setExpenses(dayExpenses.map(e => ({ description: e.description, amount: e.amount, category: e.category })));
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

    // Extract unique YYYY-MM from sales
    const uniqueMonths = React.useMemo(() => {
        if (!stats?.sales) return [];
        const months = stats.sales.map(s => s.date.substring(0, 7)); // e.g. "2026-05"
        const unique = Array.from(new Set(months)).sort((a, b) => b.localeCompare(a));
        return unique.map(m => {
            const [year, month] = m.split('-');
            const dateObj = new Date(Number(year), Number(month) - 1, 1);
            const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            return { value: m, label };
        });
    }, [stats?.sales]);

    // Apply Filter & Search Logic
    const filteredSales = React.useMemo(() => {
        if (!stats?.sales) return [];
        
        let list = [...stats.sales];

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
                const gross = sale.commissionBase + sale.cashTips;
                const net = sale.cashCommission + sale.netCheck + sale.cashTips;
                
                const dayExpenses = stats.expenses.filter(e => e.date === sale.date);
                const totalDayExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
                const profit = net - totalDayExpenses;

                if (
                    sale.serviceSales.toString().includes(query) ||
                    sale.cashTips.toString().includes(query) ||
                    sale.ccTips.toString().includes(query) ||
                    gross.toFixed(2).includes(query) ||
                    net.toFixed(2).includes(query) ||
                    profit.toFixed(2).includes(query)
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
            } else if (sortBy === 'gross') {
                const aGross = a.commissionBase + a.cashTips;
                const bGross = b.commissionBase + b.cashTips;
                comparison = aGross - bGross;
                if (comparison === 0) {
                    comparison = a.date.localeCompare(b.date);
                }
            } else if (sortBy === 'profit') {
                const aExpenses = stats.expenses.filter(e => e.date === a.date).reduce((sum, e) => sum + e.amount, 0);
                const bExpenses = stats.expenses.filter(e => e.date === b.date).reduce((sum, e) => sum + e.amount, 0);
                const aProfit = (a.cashCommission + a.netCheck + a.cashTips) - aExpenses;
                const bProfit = (b.cashCommission + b.netCheck + b.cashTips) - bExpenses;
                comparison = aProfit - bProfit;
                if (comparison === 0) {
                    comparison = a.date.localeCompare(b.date);
                }
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });

        return list;
    }, [stats?.sales, stats?.expenses, searchQuery, selectedMonth, sortBy, sortOrder]);

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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Sales ($)</label>
                            <input
                                type="number"
                                step="any"
                                value={serviceSales || ''}
                                onChange={(e) => setServiceSales(Number(e.target.value))}
                                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cash Tips ($)</label>
                            <input
                                type="number"
                                step="any"
                                value={cashTips || ''}
                                onChange={(e) => setCashTips(Number(e.target.value))}
                                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CC Tips ($)</label>
                            <input
                                type="number"
                                step="any"
                                value={ccTips || ''}
                                onChange={(e) => setCcTips(Number(e.target.value))}
                                className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entry Description / Notes</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white placeholder-gray-400 focus:border-orange-300 dark:focus:border-slate-600 transition-colors"
                            placeholder="Add a description or note for today's entry (e.g., Weather, special events, busy shift info)..."
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="text-md font-semibold text-gray-900 dark:text-white">Expenses</h4>
                            <SoftButton
                                type="button"
                                onClick={addExpense}
                                className="text-pink-600 dark:text-pink-300"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Expense
                            </SoftButton>
                        </div>

                        {expenses.map((expense, index) => (
                            <div key={index} className="grid grid-cols-1 items-end gap-4 rounded-[24px] border border-orange-100 bg-orange-50/60 p-4 dark:border-white/10 dark:bg-slate-800/70 md:grid-cols-3">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                                    <input
                                        type="text"
                                        value={expense.description}
                                        onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                        className="w-full rounded-2xl border border-white bg-white/90 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-200 dark:focus:border-slate-700 transition-colors"
                                        placeholder="e.g., Gas, Food, Supplies"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={expense.amount || ''}
                                        onChange={(e) => updateExpense(index, 'amount', Number(e.target.value))}
                                        className="w-full rounded-2xl border border-white bg-white/90 px-3 py-2 text-sm text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-200 dark:focus:border-slate-700 transition-colors"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex items-center justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeExpense(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
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
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full px-4 py-2 text-sm rounded-2xl border border-orange-100/80 bg-orange-50/20 text-gray-900 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white focus:border-orange-300 dark:focus:border-slate-700 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="date">📅 Sort by Date</option>
                            <option value="gross">💰 Sort by Gross</option>
                            <option value="profit">📈 Sort by Net Profit</option>
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
                            const netPayout = sale.cashCommission + sale.netCheck + sale.cashTips;
                            const realProfit = netPayout - totalDayExpenses;
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
                                                        <span>{dayExpenses.map(e => `${e.description} ($${e.amount})`).join(', ')}</span>
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
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Gross</p>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">${(sale.commissionBase + sale.cashTips).toFixed(0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Expenses</p>
                                                    <p className="text-sm font-bold text-red-500">${totalDayExpenses.toFixed(0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Net Profit</p>
                                                    <p className={`text-sm font-extrabold ${realProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        ${realProfit.toFixed(0)}
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
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Service Sales</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">${sale.serviceSales.toFixed(2)}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Cash Tips</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">${sale.cashTips.toFixed(2)}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">CC Tips</span>
                                                    <span className="text-base font-bold text-gray-900 dark:text-white">${sale.ccTips.toFixed(2)}</span>
                                                </div>
                                                <div className="p-3 bg-white dark:bg-slate-800/40 rounded-2xl border border-gray-50 dark:border-slate-800">
                                                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Net Paycheck</span>
                                                    <span className="text-base font-bold text-blue-500">${sale.netCheck.toFixed(2)}</span>
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
                                                                <span className="text-sm font-bold text-red-500">${exp.amount.toFixed(2)}</span>
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

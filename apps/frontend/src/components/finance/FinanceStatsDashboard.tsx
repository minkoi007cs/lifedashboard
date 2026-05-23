import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { formatMoney } from '../../lib/format-money';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { ArrowDown, ArrowUp, LayoutDashboard, LineChart as LineIcon, PieChart as PieIcon, ReceiptText, Wallet } from 'lucide-react';

interface Sale {
    id: string;
    serviceSales: number;
    cashTips: number;
    date: string;
}

interface Expense {
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
}

interface StatsData {
    totalExpenses: number;
    totalRealProfit: number;
    totalCheckIncome?: number;
    totalCashIncome?: number;
    totalGrossIncome?: number;
    totalTaxAmount?: number;
    totalNetIncome?: number;
    sales: Sale[];
    expenses: Expense[];
}

interface ReportRow {
    key: string;
    label: string;
    checkIncome: number;
    cashIncome: number;
    totalIncome: number;
    tax: number;
    expenses: number;
    balance: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];
const DASHBOARD_PREF_KEY = 'finance-dashboard-periods:v3';
const CHART_PREF_KEY = 'finance-dashboard-chart-periods:v1';
const CHART_VISIBILITY_PREF_KEY = 'finance-dashboard-chart-series:v1';
const TAX_RATE = 0.15;

type PeriodKey = 'thisMonth' | 'lastMonth' | 'last30Days' | 'last90Days' | 'thisYear' | 'lastYear' | 'allTime';
type KpiSection = 'checkIncome' | 'cashIncome' | 'totalIncome' | 'expenses' | 'taxes' | 'balance';
type ChartSection = 'incomeExpense' | 'balanceTrend';
type IncomeExpenseSeries = 'checkIncome' | 'cashIncome' | 'expenses' | 'tax';
type BalanceTrendSeries = 'totalIncome' | 'expenses' | 'tax' | 'balance';

type DashboardPeriods = Record<KpiSection, PeriodKey>;
type ChartPeriods = Record<ChartSection, PeriodKey>;
type ChartSeriesVisibility = {
    incomeExpense: Record<IncomeExpenseSeries, boolean>;
    balanceTrend: Record<BalanceTrendSeries, boolean>;
};

const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
    { value: 'thisMonth', label: 'This month' },
    { value: 'lastMonth', label: 'Last month' },
    { value: 'last30Days', label: 'Last 30 days' },
    { value: 'last90Days', label: 'Last 90 days' },
    { value: 'thisYear', label: 'This year' },
    { value: 'lastYear', label: 'Last year' },
    { value: 'allTime', label: 'All time' },
];

const DEFAULT_PERIODS: DashboardPeriods = {
    checkIncome: 'thisMonth',
    cashIncome: 'thisMonth',
    totalIncome: 'thisMonth',
    expenses: 'thisMonth',
    taxes: 'thisMonth',
    balance: 'thisMonth',
};

const DEFAULT_CHART_PERIODS: ChartPeriods = {
    incomeExpense: 'last30Days',
    balanceTrend: 'last90Days',
};

const DEFAULT_CHART_VISIBILITY: ChartSeriesVisibility = {
    incomeExpense: {
        checkIncome: true,
        cashIncome: true,
        expenses: true,
        tax: true,
    },
    balanceTrend: {
        totalIncome: true,
        expenses: true,
        tax: true,
        balance: true,
    },
};

const INCOME_EXPENSE_SERIES: { key: IncomeExpenseSeries; label: string; color: string }[] = [
    { key: 'checkIncome', label: 'Check income', color: '#3b82f6' },
    { key: 'cashIncome', label: 'Cash income', color: '#10b981' },
    { key: 'expenses', label: 'Expense', color: '#ef4444' },
    { key: 'tax', label: 'Tax', color: '#f59e0b' },
];

const BALANCE_TREND_SERIES: { key: BalanceTrendSeries; label: string; color: string }[] = [
    { key: 'totalIncome', label: 'Total income', color: '#3b82f6' },
    { key: 'expenses', label: 'Expense', color: '#ef4444' },
    { key: 'tax', label: 'Tax', color: '#f59e0b' },
    { key: 'balance', label: 'Balance', color: '#10b981' },
];

const isPeriodKey = (value: string): value is PeriodKey =>
    PERIOD_OPTIONS.some(option => option.value === value);

const loadDashboardPeriods = (): DashboardPeriods => {
    try {
        const raw = localStorage.getItem(DASHBOARD_PREF_KEY);
        if (!raw) return DEFAULT_PERIODS;

        const parsed = JSON.parse(raw) as Partial<Record<KpiSection, string>>;
        return Object.fromEntries(
            (Object.keys(DEFAULT_PERIODS) as KpiSection[]).map(section => [
                section,
                parsed[section] && isPeriodKey(parsed[section]) ? parsed[section] : DEFAULT_PERIODS[section],
            ]),
        ) as DashboardPeriods;
    } catch {
        return DEFAULT_PERIODS;
    }
};

const loadChartPeriods = (): ChartPeriods => {
    try {
        const raw = localStorage.getItem(CHART_PREF_KEY);
        if (!raw) return DEFAULT_CHART_PERIODS;

        const parsed = JSON.parse(raw) as Partial<Record<ChartSection, string>>;
        return Object.fromEntries(
            (Object.keys(DEFAULT_CHART_PERIODS) as ChartSection[]).map(section => [
                section,
                parsed[section] && isPeriodKey(parsed[section]) ? parsed[section] : DEFAULT_CHART_PERIODS[section],
            ]),
        ) as ChartPeriods;
    } catch {
        return DEFAULT_CHART_PERIODS;
    }
};

const loadChartVisibility = (): ChartSeriesVisibility => {
    try {
        const raw = localStorage.getItem(CHART_VISIBILITY_PREF_KEY);
        if (!raw) return DEFAULT_CHART_VISIBILITY;

        const parsed = JSON.parse(raw) as Partial<{
            incomeExpense: Partial<Record<IncomeExpenseSeries, boolean>>;
            balanceTrend: Partial<Record<BalanceTrendSeries, boolean>>;
        }>;

        return {
            incomeExpense: {
                ...DEFAULT_CHART_VISIBILITY.incomeExpense,
                ...parsed.incomeExpense,
            },
            balanceTrend: {
                ...DEFAULT_CHART_VISIBILITY.balanceTrend,
                ...parsed.balanceTrend,
            },
        };
    } catch {
        return DEFAULT_CHART_VISIBILITY;
    }
};

const parseEntryDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const getPeriodRange = (period: PeriodKey) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (period === 'thisMonth') {
        return {
            start: new Date(today.getFullYear(), today.getMonth(), 1),
            end: new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999),
            label: 'Current calendar month',
        };
    }

    if (period === 'lastMonth') {
        return {
            start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
            end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
            label: 'Previous calendar month',
        };
    }

    if (period === 'last30Days' || period === 'last90Days') {
        const days = period === 'last30Days' ? 30 : 90;
        const start = new Date(today);
        start.setDate(today.getDate() - (days - 1));
        start.setHours(0, 0, 0, 0);
        return { start, end: today, label: `Rolling ${days}-day view` };
    }

    if (period === 'thisYear') {
        return {
            start: new Date(today.getFullYear(), 0, 1),
            end: new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999),
            label: 'Current calendar year',
        };
    }

    if (period === 'lastYear') {
        return {
            start: new Date(today.getFullYear() - 1, 0, 1),
            end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
            label: 'Previous calendar year',
        };
    }

    return { start: null, end: null, label: 'All tracked entries' };
};

const isInPeriod = (date: string, period: PeriodKey) => {
    const { start, end } = getPeriodRange(period);
    if (!start || !end) return true;

    const entryDate = parseEntryDate(date);
    return entryDate >= start && entryDate <= end;
};

type ReportGroupingMode = 'day' | 'week';

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekStartKey = (date: string) => {
    const entryDate = parseEntryDate(date);
    const day = entryDate.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    entryDate.setDate(entryDate.getDate() + diffToMonday);
    return toDateKey(entryDate);
};

const getGroupingMode = (period: PeriodKey): ReportGroupingMode => {
    if (period === 'thisYear' || period === 'lastYear' || period === 'allTime') return 'week';
    return 'day';
};

const getReportKey = (date: string, mode: ReportGroupingMode) => {
    if (mode === 'week') return getWeekStartKey(date);
    return date;
};

const getReportLabel = (key: string, mode: ReportGroupingMode) => {
    const [, month, day] = key.split('-');
    return mode === 'week' ? `W ${month}/${day}` : `${month}/${day}`;
};

const getCheckIncome = (sale: Sale) => sale.serviceSales || 0;
const getCashIncome = (sale: Sale) => sale.cashTips || 0;
const getTax = (sale: Sale) => getCheckIncome(sale) * TAX_RATE;
const getNetIncome = (sale: Sale) => getCheckIncome(sale) - getTax(sale) + getCashIncome(sale);
const getMoneyValue = (value: unknown) => formatMoney(Number(value) || 0);

const buildReportRows = (sales: Sale[], expenses: Expense[], period: PeriodKey): ReportRow[] => {
    const mode = getGroupingMode(period);
    const rows = new Map<string, ReportRow>();

    const ensureRow = (date: string) => {
        const key = getReportKey(date, mode);
        const existing = rows.get(key);
        if (existing) return existing;

        const row: ReportRow = {
            key,
            label: getReportLabel(key, mode),
            checkIncome: 0,
            cashIncome: 0,
            totalIncome: 0,
            tax: 0,
            expenses: 0,
            balance: 0,
        };
        rows.set(key, row);
        return row;
    };

    sales.filter(sale => isInPeriod(sale.date, period)).forEach(sale => {
        const row = ensureRow(sale.date);
        const checkIncome = getCheckIncome(sale);
        const cashIncome = getCashIncome(sale);
        row.checkIncome += checkIncome;
        row.cashIncome += cashIncome;
        row.totalIncome += checkIncome + cashIncome;
        row.tax += getTax(sale);
    });

    expenses.filter(expense => isInPeriod(expense.date, period)).forEach(expense => {
        ensureRow(expense.date).expenses += expense.amount;
    });

    return Array.from(rows.values())
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(row => ({ ...row, balance: row.totalIncome - row.tax - row.expenses }));
};

function PeriodSelect({ value, onChange }: { value: PeriodKey; onChange: (period: PeriodKey) => void }) {
    return (
        <select
            value={value}
            onChange={(event) => {
                const nextValue = event.target.value;
                if (isPeriodKey(nextValue)) onChange(nextValue);
            }}
            className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-xs font-semibold text-gray-700 outline-none dark:border-white/10 dark:bg-slate-900 dark:text-white"
        >
            {PERIOD_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    );
}

function FinanceKpiCard({
    title,
    subtitle,
    value,
    tone,
    icon,
    period,
    onPeriodChange,
    detailLeft,
    detailRight,
    footer,
}: {
    title: string;
    subtitle: string;
    value: string;
    tone: 'blue' | 'green' | 'amber' | 'red' | 'slate' | 'rose';
    icon: React.ReactNode;
    period: PeriodKey;
    onPeriodChange: (period: PeriodKey) => void;
    detailLeft: string;
    detailRight: string;
    footer: string;
}) {
    const toneClasses = {
        blue: 'border-blue-100 bg-blue-50/70 text-blue-600 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300',
        green: 'border-emerald-100 bg-emerald-50/70 text-emerald-600 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300',
        amber: 'border-amber-100 bg-amber-50/70 text-amber-600 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
        red: 'border-red-100 bg-red-50/70 text-red-500 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300',
        slate: 'border-slate-100 bg-slate-50/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-100',
        rose: 'border-rose-100 bg-rose-50/70 text-rose-500 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300',
    }[tone];

    return (
        <div className={`rounded-[28px] border p-5 ${toneClasses}`}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] opacity-80">{title}</p>
                    <h4 className="mt-1 text-sm font-semibold text-gray-700 dark:text-gray-200">{subtitle}</h4>
                </div>
                <PeriodSelect value={period} onChange={onPeriodChange} />
            </div>
            <div className="flex items-end justify-between gap-3">
                <p className="text-4xl font-black">{value}</p>
                <div className="opacity-70">{icon}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-300">
                <div className="rounded-2xl bg-white/70 px-3 py-2 dark:bg-slate-900/50">{detailLeft}</div>
                <div className="rounded-2xl bg-white/70 px-3 py-2 dark:bg-slate-900/50">{detailRight}</div>
            </div>
            <p className="mt-3 text-xs opacity-75">{footer}</p>
        </div>
    );
}

function ReportChartCard({
    title,
    subtitle,
    icon,
    period,
    onPeriodChange,
    controls,
    children,
}: {
    title: string;
    subtitle: string;
    icon: React.ReactNode;
    period: PeriodKey;
    onPeriodChange: (period: PeriodKey) => void;
    controls?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h4 className="text-md font-bold text-gray-900 dark:text-white flex items-center">
                        {icon}
                        {title}
                    </h4>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
                <PeriodSelect value={period} onChange={onPeriodChange} />
            </div>
            {controls && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {controls}
                </div>
            )}
            <div className="h-72 w-full">
                {children}
            </div>
        </div>
    );
}

function SeriesToggle({
    label,
    color,
    active,
    onToggle,
}: {
    label: string;
    color: string;
    active: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                active
                    ? 'border-transparent bg-gray-900 text-white dark:bg-white dark:text-slate-950'
                    : 'border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-slate-900 dark:text-gray-500'
            }`}
        >
            <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: active ? color : '#9ca3af' }} />
            {label}
        </button>
    );
}

interface FinanceStatsDashboardProps {
    targetUserId?: string;
}

export const FinanceStatsDashboard: React.FC<FinanceStatsDashboardProps> = ({ targetUserId }) => {
    const [periods, setPeriods] = React.useState<DashboardPeriods>(loadDashboardPeriods);
    const [chartPeriods, setChartPeriods] = React.useState<ChartPeriods>(loadChartPeriods);
    const [chartVisibility, setChartVisibility] = React.useState<ChartSeriesVisibility>(loadChartVisibility);

    const { data: stats, isLoading } = useQuery<StatsData>({
        queryKey: ['finance-stats', targetUserId ?? 'self'],
        queryFn: async () => {
            const res = await api.get('/api/v1/finance/statistics', {
                params: targetUserId ? { targetUserId } : undefined,
            });
            return res.data;
        },
    });

    React.useEffect(() => {
        localStorage.setItem(DASHBOARD_PREF_KEY, JSON.stringify(periods));
    }, [periods]);

    React.useEffect(() => {
        localStorage.setItem(CHART_PREF_KEY, JSON.stringify(chartPeriods));
    }, [chartPeriods]);

    React.useEffect(() => {
        localStorage.setItem(CHART_VISIBILITY_PREF_KEY, JSON.stringify(chartVisibility));
    }, [chartVisibility]);

    const updatePeriod = (section: KpiSection, value: PeriodKey) => {
        setPeriods(prev => ({ ...prev, [section]: value }));
    };

    const updateChartPeriod = (section: ChartSection, value: PeriodKey) => {
        setChartPeriods(prev => ({ ...prev, [section]: value }));
    };

    const toggleIncomeExpenseSeries = (series: IncomeExpenseSeries) => {
        setChartVisibility(prev => ({
            ...prev,
            incomeExpense: {
                ...prev.incomeExpense,
                [series]: !prev.incomeExpense[series],
            },
        }));
    };

    const toggleBalanceTrendSeries = (series: BalanceTrendSeries) => {
        setChartVisibility(prev => ({
            ...prev,
            balanceTrend: {
                ...prev.balanceTrend,
                [series]: !prev.balanceTrend[series],
            },
        }));
    };

    if (isLoading) return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 h-96 rounded-xl"></div>;
    if (!stats) return null;

    const salesFor = (period: PeriodKey) => stats.sales.filter(sale => isInPeriod(sale.date, period));
    const expensesFor = (period: PeriodKey) => stats.expenses.filter(expense => isInPeriod(expense.date, period));
    const sumCheck = (sales: Sale[]) => sales.reduce((sum, sale) => sum + getCheckIncome(sale), 0);
    const sumCash = (sales: Sale[]) => sales.reduce((sum, sale) => sum + getCashIncome(sale), 0);
    const sumTax = (sales: Sale[]) => sales.reduce((sum, sale) => sum + getTax(sale), 0);
    const sumNet = (sales: Sale[]) => sales.reduce((sum, sale) => sum + getNetIncome(sale), 0);
    const sumExpenses = (expenses: Expense[]) => expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const checkSales = salesFor(periods.checkIncome);
    const cashSales = salesFor(periods.cashIncome);
    const totalSales = salesFor(periods.totalIncome);
    const taxSales = salesFor(periods.taxes);
    const expenseRows = expensesFor(periods.expenses);
    const balanceSales = salesFor(periods.balance);
    const balanceExpenses = expensesFor(periods.balance);
    const balance = sumNet(balanceSales) - sumExpenses(balanceExpenses);

    const incomeExpenseData = buildReportRows(stats.sales, stats.expenses, chartPeriods.incomeExpense);
    const balanceTrendData = buildReportRows(stats.sales, stats.expenses, chartPeriods.balanceTrend);

    const expenseCategoryData = stats.expenses.reduce<{ name: string; value: number }[]>((acc, curr) => {
        const existing = acc.find(a => a.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    const allCheckIncome = stats.totalCheckIncome ?? sumCheck(stats.sales);
    const allCashIncome = stats.totalCashIncome ?? sumCash(stats.sales);
    const allGrossIncome = stats.totalGrossIncome ?? allCheckIncome + allCashIncome;
    const allTax = stats.totalTaxAmount ?? sumTax(stats.sales);
    const allNetIncome = stats.totalNetIncome ?? sumNet(stats.sales);
    const allBalance = allNetIncome - stats.totalExpenses;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                <FinanceKpiCard
                    title="Check income"
                    subtitle="Before tax"
                    value={formatMoney(sumCheck(checkSales))}
                    tone="blue"
                    icon={<ArrowUp className="h-8 w-8" />}
                    period={periods.checkIncome}
                    onPeriodChange={(period) => updatePeriod('checkIncome', period)}
                    detailLeft={`Days: ${checkSales.length}`}
                    detailRight={`Tax est: ${formatMoney(sumTax(checkSales))}`}
                    footer={getPeriodRange(periods.checkIncome).label}
                />
                <FinanceKpiCard
                    title="Cash income"
                    subtitle="Actual cash received"
                    value={formatMoney(sumCash(cashSales))}
                    tone="green"
                    icon={<Wallet className="h-8 w-8" />}
                    period={periods.cashIncome}
                    onPeriodChange={(period) => updatePeriod('cashIncome', period)}
                    detailLeft={`Days: ${cashSales.length}`}
                    detailRight={`Tax: ${formatMoney(0)}`}
                    footer={getPeriodRange(periods.cashIncome).label}
                />
                <FinanceKpiCard
                    title="Total income"
                    subtitle="Check plus cash, before tax"
                    value={formatMoney(sumCheck(totalSales) + sumCash(totalSales))}
                    tone="slate"
                    icon={<LayoutDashboard className="h-8 w-8" />}
                    period={periods.totalIncome}
                    onPeriodChange={(period) => updatePeriod('totalIncome', period)}
                    detailLeft={`Check: ${formatMoney(sumCheck(totalSales))}`}
                    detailRight={`Cash: ${formatMoney(sumCash(totalSales))}`}
                    footer={getPeriodRange(periods.totalIncome).label}
                />
                <FinanceKpiCard
                    title="Expenses"
                    subtitle="Money spent"
                    value={formatMoney(sumExpenses(expenseRows))}
                    tone="red"
                    icon={<ArrowDown className="h-8 w-8" />}
                    period={periods.expenses}
                    onPeriodChange={(period) => updatePeriod('expenses', period)}
                    detailLeft={`Items: ${expenseRows.length}`}
                    detailRight={`Avg: ${formatMoney(expenseRows.length ? sumExpenses(expenseRows) / expenseRows.length : 0)}`}
                    footer={getPeriodRange(periods.expenses).label}
                />
                <FinanceKpiCard
                    title="Taxes"
                    subtitle="15% of check income"
                    value={formatMoney(sumTax(taxSales))}
                    tone="amber"
                    icon={<ReceiptText className="h-8 w-8" />}
                    period={periods.taxes}
                    onPeriodChange={(period) => updatePeriod('taxes', period)}
                    detailLeft={`Check: ${formatMoney(sumCheck(taxSales))}`}
                    detailRight={`Rate: ${(TAX_RATE * 100).toFixed(0)}%`}
                    footer={getPeriodRange(periods.taxes).label}
                />
                <FinanceKpiCard
                    title={balance >= 0 ? 'Balance' : 'Shortfall'}
                    subtitle="Net income after tax minus expenses"
                    value={formatMoney(Math.abs(balance))}
                    tone={balance >= 0 ? 'green' : 'rose'}
                    icon={<Wallet className="h-8 w-8" />}
                    period={periods.balance}
                    onPeriodChange={(period) => updatePeriod('balance', period)}
                    detailLeft={`Net: ${formatMoney(sumNet(balanceSales))}`}
                    detailRight={`Expense: ${formatMoney(sumExpenses(balanceExpenses))}`}
                    footer={getPeriodRange(periods.balance).label}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ReportChartCard
                    title="Income, Expense & Tax Report"
                    subtitle="Check and cash income are stacked; expense and tax are shown beside income for the selected period."
                    icon={<LayoutDashboard className="w-4 h-4 mr-2 text-blue-500" />}
                    period={chartPeriods.incomeExpense}
                    onPeriodChange={(period) => updateChartPeriod('incomeExpense', period)}
                    controls={INCOME_EXPENSE_SERIES.map(series => (
                        <SeriesToggle
                            key={series.key}
                            label={series.label}
                            color={series.color}
                            active={chartVisibility.incomeExpense[series.key]}
                            onToggle={() => toggleIncomeExpenseSeries(series.key)}
                        />
                    ))}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={incomeExpenseData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getMoneyValue} />
                            <Tooltip formatter={getMoneyValue} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Legend />
                            {chartVisibility.incomeExpense.checkIncome && <Bar dataKey="checkIncome" stackId="income" name="Check income" fill="#3b82f6" radius={[4, 4, 0, 0]} />}
                            {chartVisibility.incomeExpense.cashIncome && <Bar dataKey="cashIncome" stackId="income" name="Cash income" fill="#10b981" radius={[4, 4, 0, 0]} />}
                            {chartVisibility.incomeExpense.expenses && <Bar dataKey="expenses" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />}
                            {chartVisibility.incomeExpense.tax && <Bar dataKey="tax" name="Tax" fill="#f59e0b" radius={[4, 4, 0, 0]} />}
                        </BarChart>
                    </ResponsiveContainer>
                </ReportChartCard>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <PieIcon className="w-4 h-4 mr-2 text-emerald-500" />
                        Expense Breakdown
                    </h4>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={expenseCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {expenseCategoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={getMoneyValue} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <ReportChartCard
                title="Balance Trend"
                subtitle="Tracks total income, expenses, tax, and resulting balance for the selected period."
                icon={<LineIcon className="w-4 h-4 mr-2 text-purple-500" />}
                period={chartPeriods.balanceTrend}
                onPeriodChange={(period) => updateChartPeriod('balanceTrend', period)}
                controls={BALANCE_TREND_SERIES.map(series => (
                    <SeriesToggle
                        key={series.key}
                        label={series.label}
                        color={series.color}
                        active={chartVisibility.balanceTrend[series.key]}
                        onToggle={() => toggleBalanceTrendSeries(series.key)}
                    />
                ))}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={balanceTrendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                        <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={getMoneyValue} />
                        <Tooltip formatter={getMoneyValue} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                        <Legend />
                        {chartVisibility.balanceTrend.totalIncome && <Line type="monotone" dataKey="totalIncome" name="Total income" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                        {chartVisibility.balanceTrend.expenses && <Line type="monotone" dataKey="expenses" name="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                        {chartVisibility.balanceTrend.tax && <Line type="monotone" dataKey="tax" name="Tax" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                        {chartVisibility.balanceTrend.balance && <Line type="monotone" dataKey="balance" name="Balance" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />}
                    </LineChart>
                </ResponsiveContainer>
            </ReportChartCard>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Records</p>
                    <p className="text-xl font-bold dark:text-white">{stats.sales.length} days</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Check Income</p>
                    <p className="text-xl font-bold text-blue-500">{formatMoney(allCheckIncome)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Cash Income</p>
                    <p className="text-xl font-bold text-emerald-500">{formatMoney(allCashIncome)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Gross Income</p>
                    <p className="text-xl font-bold dark:text-white">{formatMoney(allGrossIncome)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Taxes</p>
                    <p className="text-xl font-bold text-amber-500">{formatMoney(allTax)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mb-1">Balance</p>
                    <p className={`text-xl font-bold ${allBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatMoney(allBalance)}
                    </p>
                </div>
            </div>
        </div>
    );
};

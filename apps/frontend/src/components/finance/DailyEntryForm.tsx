import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import { Plus, Trash2, Save, Calculator } from 'lucide-react';

interface Expense {
    description: string;
    amount: number;
    category?: string;
}

export const DailyEntryForm: React.FC = () => {
    const queryClient = useQueryClient();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [serviceSales, setServiceSales] = useState(0);
    const [cashTips, setCashTips] = useState(0);
    const [ccTips, setCcTips] = useState(0);
    const [expenses, setExpenses] = useState<Expense[]>([]);

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

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/api/v1/finance/daily-entry', data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
            queryClient.invalidateQueries({ queryKey: ['active-pay-period'] });
            alert('Daily entry saved successfully!');
            // Reset form
            setServiceSales(0);
            setCashTips(0);
            setCcTips(0);
            setExpenses([]);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            date,
            serviceSales,
            cashTips,
            ccTips,
            expenses,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-blue-500" />
                    Daily Entry
                </h3>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 text-sm text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service Sales ($)</label>
                    <input
                        type="number"
                        value={serviceSales}
                        onChange={(e) => setServiceSales(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cash Tips ($)</label>
                    <input
                        type="number"
                        value={cashTips}
                        onChange={(e) => setCashTips(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                        placeholder="0.00"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CC Tips ($)</label>
                    <input
                        type="number"
                        value={ccTips}
                        onChange={(e) => setCcTips(Number(e.target.value))}
                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">Expenses</h4>
                    <button
                        type="button"
                        onClick={addExpense}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                        <Plus className="w-4 h-4 mr-1" /> Add Expense
                    </button>
                </div>

                {expenses.map((expense, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="md:col-span-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</label>
                            <input
                                type="text"
                                value={expense.description}
                                onChange={(e) => updateExpense(index, 'description', e.target.value)}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white"
                                placeholder="e.g., Gas, Food, Supplies"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount ($)</label>
                            <input
                                type="number"
                                value={expense.amount}
                                onChange={(e) => updateExpense(index, 'amount', Number(e.target.value))}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-900 dark:text-white"
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

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
                {mutation.isPending ? 'Saving...' : (
                    <>
                        <Save className="w-5 h-5 mr-2" />
                        Save Daily Entry
                    </>
                )}
            </button>
        </form>
    );
};

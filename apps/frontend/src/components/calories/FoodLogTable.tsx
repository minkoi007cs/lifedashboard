import React from 'react';
import type { FoodEntry } from '../../types/calories';
import { Trash2, Utensils } from 'lucide-react';

interface FoodLogTableProps {
    entries: FoodEntry[];
    onDelete?: (id: string) => void;
}

export const FoodLogTable: React.FC<FoodLogTableProps> = ({ entries, onDelete }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold flex items-center text-gray-900 dark:text-white">
                    <Utensils className="w-4 h-4 mr-2 text-orange-500" />
                    Recent Food Logs
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Food</th>
                            <th className="px-6 py-3">Calories</th>
                            <th className="px-6 py-3">Macros (P/F/C)</th>
                            <th className="px-6 py-3">Meal</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {entries.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No logs found for this period.</td>
                            </tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{entry.name}</td>
                                    <td className="px-6 py-4">{entry.calories.toFixed(0)} kcal</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="text-blue-500 font-bold">{entry.protein.toFixed(0)}g</span> /
                                        <span className="text-yellow-500 font-bold ml-1">{entry.fat.toFixed(0)}g</span> /
                                        <span className="text-green-500 font-bold ml-1">{entry.carbs.toFixed(0)}g</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-[10px] font-bold uppercase">{entry.mealType}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(entry.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

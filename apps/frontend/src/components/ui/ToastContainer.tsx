import React from 'react';
import { useToastStore } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
    const { toasts, hideToast } = useToastStore();

    if (toasts.length === 0) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
            default:
                return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300';
            case 'error':
                return 'bg-red-50/90 dark:bg-red-950/30 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300';
            case 'warning':
                return 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-300';
            default:
                return 'bg-blue-50/90 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30 text-blue-800 dark:text-blue-300';
        }
    };

    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg pointer-events-auto transition-all duration-300 animate-in slide-in-from-top-5 fade-in-20 ${getBgColor(toast.type)}`}
                >
                    <div className="flex items-center gap-3">
                        {getIcon(toast.type)}
                        <p className="text-sm font-semibold leading-5">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => hideToast(toast.id)}
                        className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-current opacity-65 hover:opacity-100 shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

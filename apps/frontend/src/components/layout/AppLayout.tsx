import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, CheckSquare, Zap, Target, DollarSign, LogOut, Utensils } from 'lucide-react';

export const AppLayout: React.FC = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-primary">LifeDash</h1>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link to="/" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Dashboard
                    </Link>
                    <Link to="/tasks" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <CheckSquare className="w-5 h-5 mr-3" />
                        Tasks
                    </Link>
                    <Link to="/habits" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Zap className="w-5 h-5 mr-3" />
                        Habits
                    </Link>
                    <Link to="/focus" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Target className="w-5 h-5 mr-3" />
                        Focus
                    </Link>
                    <Link to="/finance" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <DollarSign className="w-5 h-5 mr-3" />
                        Finance
                    </Link>
                    <Link to="/calories" className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Utensils className="w-5 h-5 mr-3" />
                        Calories
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center mb-4">
                        <img src={user?.avatarUrl || 'https://via.placeholder.com/40'} alt="Avatar" className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
};

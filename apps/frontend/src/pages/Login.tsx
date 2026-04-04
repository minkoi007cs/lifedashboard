import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { getApiBaseUrl } from '../lib/api-config';

export const Login: React.FC = () => {
    const { login, user } = useAuthStore();
    const navigate = useNavigate();
    const [devLoading, setDevLoading] = useState(false);

    useEffect(() => {
        // Handle the OAuth callback token in query params (?token=...)
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            login(token).then(() => navigate('/'));
        }
    }, [login, navigate]);

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const handleGoogleLogin = () => {
        const apiUrl = getApiBaseUrl();
        window.location.href = `${apiUrl}/api/v1/auth/google`;
    };

    const handleDevLogin = async () => {
        setDevLoading(true);
        try {
            const res = await api.post('/api/v1/auth/dev-login', {});
            await login(res.data.accessToken);
            navigate('/');
        } catch (err) {
            console.error('Dev login failed', err);
        } finally {
            setDevLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">Life Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                    Manage your tasks, habits, finance, and focus in one place.
                </p>

                {/* Google Login */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 mb-3"
                >
                    <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                    Sign in with Google
                </button>

                {/* Dev Login — only shown in dev */}
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs text-gray-400">
                        <span className="bg-white dark:bg-gray-800 px-2">or</span>
                    </div>
                </div>

                <button
                    onClick={handleDevLogin}
                    disabled={devLoading}
                    className="w-full px-4 py-3 rounded-md text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 disabled:opacity-50"
                >
                    {devLoading ? 'Logging in...' : '⚡ Dev Login (skip OAuth)'}
                </button>
                <p className="text-xs text-gray-400 mt-2">Dev mode only — not available in production</p>
            </div>
        </div>
    );
};

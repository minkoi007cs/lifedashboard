import { create } from 'zustand';
import api from '../lib/axios';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('token'),
    isLoading: true,
    login: async (token: string) => {
        localStorage.setItem('token', token);
        set({ token });
        try {
            const response = await api.get('/api/v1/users/profile');
            set({ user: response.data, isLoading: false });
        } catch (error) {
            console.error("Failed to fetch profile", error);
            set({ isLoading: false });
        }
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
    },
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isLoading: false });
            return;
        }
        try {
            const response = await api.get('/api/v1/users/profile');
            set({ user: response.data, isLoading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, token: null, isLoading: false });
        }
    }
}));

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import api from '../lib/axios';
import { queryClient } from '../lib/query-client';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    /** Google OAuth qua Supabase; quay lại đúng trang `redirectPath` sau khi login. */
    login: (redirectPath?: string) => Promise<void>;
    logout: () => Promise<void>;
    /** Gọi 1 lần khi app mount: đọc session hiện tại + lắng nghe thay đổi (login/refresh/logout). */
    init: () => () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
    const loadProfile = async (session: Session | null) => {
        if (!session) {
            set({ user: null, session: null, isLoading: false });
            return;
        }
        set({ session });
        // Chỉ tải profile khi đổi user (TOKEN_REFRESHED không cần gọi lại)
        if (get().user?.email === session.user.email) {
            set({ isLoading: false });
            return;
        }
        try {
            const response = await api.get('/api/v1/users/profile');
            set({ user: response.data, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch profile', error);
            set({ user: null, isLoading: false });
        }
    };

    return {
        user: null,
        session: null,
        isLoading: true,
        login: async (redirectPath = '/') => {
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}${redirectPath}` },
            });
        },
        logout: async () => {
            await supabase.auth.signOut();
            queryClient.clear();
            set({ user: null, session: null });
        },
        init: () => {
            void supabase.auth.getSession().then(({ data }) => loadProfile(data.session));
            const { data } = supabase.auth.onAuthStateChange((_event, session) => {
                // Không await trong callback (khuyến nghị của supabase-js để tránh deadlock)
                setTimeout(() => void loadProfile(session), 0);
            });
            return () => data.subscription.unsubscribe();
        },
    };
});

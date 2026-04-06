import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { type ThemeMode, useTheme } from '../theme/theme-context';
import api from '../../lib/axios';
import {
  Bell,
  CheckSquare,
  DollarSign,
  Gift,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Settings,
  Sparkles,
  Sun,
  Target,
  Utensils,
  X,
  Zap,
} from 'lucide-react';
import type { NotificationPayload } from '../../types/notification';

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigationItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
  { to: '/wishlist', label: 'Wishlist', icon: Gift },
  { to: '/habits', label: 'Habits', icon: Zap },
  { to: '/focus', label: 'Focus', icon: Target },
  { to: '/finance', label: 'Finance', icon: DollarSign },
  { to: '/calories', label: 'Calories', icon: Utensils },
];

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    value: 'system',
    label: 'Auto',
    description: 'Follow device setting',
    icon: Monitor,
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and airy',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Low-light friendly',
    icon: Moon,
  },
];

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuthStore();
  const { mode, resolvedTheme, setMode } = useTheme();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/50 px-5 pb-5 pt-6 dark:border-white/10">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-lg shadow-orange-200/40 ring-1 ring-orange-100 backdrop-blur dark:bg-slate-900/80 dark:shadow-slate-950/30 dark:ring-white/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/50">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500 dark:text-orange-300">
              LifeDash
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bright personal control center
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={handleNavClick}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-orange-400 via-pink-500 to-fuchsia-600 text-white shadow-lg shadow-pink-300/40'
                    : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/50 p-4 dark:border-white/10">
        <div className="rounded-3xl bg-white/80 p-4 shadow-xl shadow-orange-200/25 ring-1 ring-orange-100 backdrop-blur dark:bg-slate-900/80 dark:shadow-slate-950/30 dark:ring-white/10">
          <div className="mb-3 flex items-center gap-3">
            <img
              src={user?.avatarUrl || 'https://via.placeholder.com/40'}
              alt="Avatar"
              className="h-11 w-11 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-orange-50 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-300">
              {mode}
            </span>
          </button>

          {isSettingsOpen ? (
            <div className="mt-3 rounded-2xl border border-orange-100 bg-orange-50/80 p-3 dark:border-white/10 dark:bg-slate-800/80">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                Appearance
              </p>
              <div className="space-y-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={[
                        'flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition',
                        isSelected
                          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                          : 'text-slate-600 hover:bg-white/80 dark:text-slate-300 dark:hover:bg-slate-900/70',
                      ].join(' ')}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-300 to-pink-500 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{option.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {option.description}
                        </p>
                      </div>
                      {isSelected ? (
                        <span className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                          {resolvedTheme}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/20 dark:text-red-400 dark:hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export const AppLayout: React.FC = () => {
  const { user } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications } = useQuery<NotificationPayload>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/api/v1/notifications')).data,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch('/api/v1/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => api.patch(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const closeSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('resize', closeSidebar);

    return () => {
      window.removeEventListener('resize', closeSidebar);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.16),_transparent_28%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.15),_transparent_24%)] dark:text-white">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <div
          className={[
            'fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition md:hidden',
            isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={() => setIsSidebarOpen(false)}
        />

        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[320px] -translate-x-full border-r border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,237,0.9))] shadow-2xl shadow-orange-200/30 backdrop-blur-xl transition-transform dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] dark:shadow-slate-950/40 md:sticky md:top-0 md:h-screen md:w-80 md:translate-x-0',
            isSidebarOpen ? 'translate-x-0' : '',
          ].join(' ')}
        >
          <div className="flex items-center justify-between px-4 pt-4 md:hidden">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-white/80 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <SidebarContent onNavigate={() => setIsSidebarOpen(false)} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/40 bg-white/75 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pink-500 dark:text-pink-300">
                    Daily flow
                  </p>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white md:text-2xl">
                    Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((value) => !value)}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-white text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications?.unreadCount ? (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {notifications.unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationsOpen ? (
                    <div className="absolute right-0 top-14 z-40 w-[320px] rounded-[28px] border border-white/60 bg-white/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.2)] backdrop-blur dark:border-white/10 dark:bg-slate-900/92">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{notifications?.unreadCount ?? 0} unread</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="text-xs font-semibold text-pink-500 transition hover:text-pink-600"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {notifications?.items?.length ? notifications.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (!item.isRead) {
                                markReadMutation.mutate(item.id);
                              }
                              setIsNotificationsOpen(false);
                              if (item.link) {
                                navigate(item.link);
                              }
                            }}
                            className="w-full rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-left transition hover:bg-orange-100/70 dark:border-white/10 dark:bg-slate-800/80 dark:hover:bg-slate-800"
                          >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{item.message}</p>
                            {!item.isRead ? <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-pink-500">Unread</p> : null}
                          </button>
                        )) : (
                          <p className="rounded-2xl border border-dashed border-orange-100 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                            No notifications yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="hidden items-center gap-3 rounded-2xl bg-white/80 px-3 py-2 shadow-sm ring-1 ring-orange-100 dark:bg-slate-900/80 dark:ring-white/10 sm:flex">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your dashboard is synced
                  </p>
                </div>
                <img
                  src={user?.avatarUrl || 'https://via.placeholder.com/40'}
                  alt="Avatar"
                  className="h-10 w-10 rounded-2xl object-cover ring-2 ring-white dark:ring-slate-700"
                />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { type ThemeMode, useTheme } from '../theme/theme-context';
import { themePresets, type ThemePreset } from '../theme/theme-presets';
import api from '../../lib/axios';
import {
  Bell,
  CheckSquare,
  CircleHelp,
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
import { HelpPanel } from '../help/HelpPanel';
import { getHelpPageKey } from '../../help/help-content';

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

const presetIcons: Record<
  ThemePreset,
  React.ComponentType<{ className?: string }>
> = {
  aurora: Sparkles,
  modernist: LayoutDashboard,
  heritage: Sun,
  vintage: Gift,
  noir: Moon,
};

function SettingsPanel({
  mode,
  preset,
  resolvedTheme,
  onClose,
  onModeChange,
  onPresetChange,
}: {
  mode: ThemeMode;
  preset: ThemePreset;
  resolvedTheme: 'light' | 'dark';
  onClose: () => void;
  onModeChange: (mode: ThemeMode) => void;
  onPresetChange: (preset: ThemePreset) => void;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] rounded-t-[32px] border border-white/40 bg-[hsl(var(--background))] p-5 shadow-[0_-20px_80px_rgba(15,23,42,0.22)] sm:bottom-4 sm:left-auto sm:right-4 sm:top-4 sm:w-[430px] sm:rounded-[32px] dark:border-white/10"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="theme-eyebrow mb-2 text-xs font-semibold uppercase tracking-[0.24em]">
              Personalize
            </p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Appearance settings
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Choose how the whole app should feel: brightness mode,
              typography, color story and frame language.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="theme-soft-button h-11 w-11 px-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto pr-1">
          <section className="space-y-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Brightness mode
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auto follows device preference. Current output: {resolvedTheme}.
              </p>
            </div>
            <div className="grid gap-2">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = mode === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onModeChange(option.value)}
                    className={[
                      'theme-mode-row flex w-full items-center gap-3 rounded-[24px] px-4 py-3 text-left transition',
                      isSelected ? 'theme-mode-row-active' : '',
                    ].join(' ')}
                  >
                    <div className="theme-icon-badge flex h-10 w-10 items-center justify-center text-white">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </p>
                    </div>
                    {isSelected ? (
                      <span className="theme-selected-tag text-[11px] font-semibold uppercase tracking-wide">
                        Active
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Theme presets
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each preset changes palette, heading voice, card feel and shell
                attitude.
              </p>
            </div>
            <div className="grid gap-3">
              {themePresets.map((themePreset) => {
                const Icon = presetIcons[themePreset.value];
                const isSelected = preset === themePreset.value;

                return (
                  <button
                    key={themePreset.value}
                    type="button"
                    onClick={() => onPresetChange(themePreset.value)}
                    className={[
                      'theme-preset-card w-full rounded-[26px] border p-4 text-left transition',
                      isSelected ? 'theme-preset-card-active' : '',
                    ].join(' ')}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-[18px] text-white shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${themePreset.preview.from}, ${themePreset.preview.via}, ${themePreset.preview.to})`,
                          }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-white">
                            {themePreset.label}
                          </p>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            {themePreset.era}
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <span className="theme-selected-tag text-[11px] font-semibold uppercase tracking-wide">
                          Selected
                        </span>
                      ) : null}
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                      {[
                        themePreset.preview.from,
                        themePreset.preview.via,
                        themePreset.preview.to,
                      ].map((swatch) => (
                        <span
                          key={swatch}
                          className="h-3 w-10 rounded-full"
                          style={{ backgroundColor: swatch }}
                        />
                      ))}
                      <span
                        className="ml-1 h-8 flex-1 rounded-[14px] border"
                        style={{
                          backgroundColor: themePreset.preview.surface,
                          borderColor: `${themePreset.preview.ink}22`,
                        }}
                      />
                    </div>

                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {themePreset.description}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {themePreset.mood}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function SidebarContent({
  onNavigate,
  onOpenHelp,
}: {
  onNavigate?: () => void;
  onOpenHelp: () => void;
}) {
  const { user, logout } = useAuthStore();
  const { mode, preset, resolvedTheme, setMode, setPreset } = useTheme();
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
          <div className="theme-icon-badge flex h-10 w-10 items-center justify-center rounded-2xl text-white">
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
                    ? 'theme-tab-active'
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
        <div className="themed-surface p-4">
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
            onClick={() => setIsSettingsOpen(true)}
            className="theme-soft-button flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold"
          >
            <span className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </span>
            <span className="theme-settings-chip px-2 py-0.5 text-[11px] uppercase tracking-wide">
              {preset}
            </span>
          </button>

          {isSettingsOpen ? (
            <SettingsPanel
              mode={mode}
              preset={preset}
              resolvedTheme={resolvedTheme}
              onClose={() => setIsSettingsOpen(false)}
              onModeChange={setMode}
              onPresetChange={setPreset}
            />
          ) : null}

          <button
            type="button"
            onClick={onOpenHelp}
            className="theme-soft-button mt-3 flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
          >
            <CircleHelp className="h-4 w-4" />
            Help
          </button>

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
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const helpPageKey = getHelpPageKey(location.pathname);

  const { data: notifications } = useQuery<NotificationPayload>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/api/v1/notifications')).data,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => api.patch('/api/v1/notifications/read-all'),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) =>
      api.patch(`/api/v1/notifications/${notificationId}/read`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  useEffect(() => {
    const closeSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('resize', closeSidebar);

    return () => {
      window.removeEventListener('resize', closeSidebar);
    };
  }, []);

  return (
    <div className="themed-app-shell min-h-screen text-slate-900 transition-colors dark:text-white">
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
            'themed-sidebar fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[320px] -translate-x-full transition-transform md:sticky md:top-0 md:h-screen md:w-80 md:translate-x-0',
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
          <SidebarContent
            onNavigate={() => setIsSidebarOpen(false)}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="themed-topbar sticky top-0 z-30 px-4 py-3 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="theme-soft-button inline-flex h-11 w-11 items-center justify-center px-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="theme-eyebrow text-xs font-semibold uppercase tracking-[0.25em]">
                    Daily flow
                  </p>
                  <h1 className="text-lg font-black text-slate-900 dark:text-white md:text-2xl">
                    Welcome back
                    {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationsOpen((value) => !value)}
                    className="theme-soft-button relative inline-flex h-11 w-11 items-center justify-center px-0"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications?.unreadCount ? (
                      <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {notifications.unreadCount}
                      </span>
                    ) : null}
                  </button>

                  {isNotificationsOpen ? (
                    <div className="themed-surface absolute right-0 top-14 z-40 w-[320px] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">
                            Notifications
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {notifications?.unreadCount ?? 0} unread
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markAllReadMutation.mutate()}
                          className="theme-eyebrow text-xs font-semibold transition hover:opacity-80"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-80 space-y-2 overflow-y-auto">
                        {notifications?.items?.length ? (
                          notifications.items.map((item) => (
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
                              className="theme-notification-row w-full rounded-2xl px-4 py-3 text-left transition"
                            >
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {item.title}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {item.message}
                              </p>
                              {!item.isRead ? (
                                <p className="theme-eyebrow mt-2 text-[10px] font-bold uppercase tracking-[0.18em]">
                                  Unread
                                </p>
                              ) : null}
                            </button>
                          ))
                        ) : (
                          <p className="rounded-2xl border border-dashed border-orange-100 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">
                            No notifications yet.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="theme-profile-chip hidden items-center gap-3 px-3 py-2 sm:flex">
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
      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        pageKey={helpPageKey}
      />
    </div>
  );
};

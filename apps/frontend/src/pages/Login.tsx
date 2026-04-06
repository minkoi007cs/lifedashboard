import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, Moon, Sparkles, Sun } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';
import { getApiBaseUrl } from '../lib/api-config';
import { useTheme } from '../components/theme/theme-context';
import { ActionButton, SoftButton, SurfaceCard } from '../components/ui/shell';

export const Login: React.FC = () => {
  const { login, user } = useAuthStore();
  const navigate = useNavigate();
  const [devLoading, setDevLoading] = useState(false);
  const { mode, setMode } = useTheme();

  useEffect(() => {
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.24),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.18),_transparent_32%)] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.14),_transparent_24%)]">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="hidden rounded-[34px] border border-white/60 bg-white/70 p-8 shadow-[0_25px_80px_rgba(251,146,60,0.16)] backdrop-blur lg:block dark:border-white/10 dark:bg-slate-900/72 dark:shadow-[0_25px_80px_rgba(2,6,23,0.42)]">
          <div className="mb-6 inline-flex items-center gap-3 rounded-2xl bg-white/80 px-4 py-3 shadow-lg dark:bg-slate-800/90">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pink-500 dark:text-pink-300">
                LifeDash
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Daily life, one colorful cockpit
              </p>
            </div>
          </div>
          <h1 className="max-w-xl text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Manage tasks, habits, finance and nutrition from one bright home
            screen.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">
            Built for everyday rhythm: plan work, keep streaks going, review
            profit, track calories and stay focused without jumping across
            apps.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              'Task planning',
              'Habit streaks',
              'Finance tracking',
              'Calories dashboard',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl bg-orange-50/80 px-4 py-3 text-sm font-semibold text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <SurfaceCard className="mx-auto w-full max-w-md p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-fuchsia-600 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Life Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sign in to continue
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-2">
            <SoftButton
              onClick={() => setMode('light')}
              className={
                mode === 'light'
                  ? 'border-pink-200 bg-pink-50 text-pink-600 dark:bg-slate-800'
                  : ''
              }
            >
              <Sun className="mr-2 h-4 w-4" /> Light
            </SoftButton>
            <SoftButton
              onClick={() => setMode('dark')}
              className={
                mode === 'dark'
                  ? 'border-pink-200 bg-pink-50 text-pink-600 dark:bg-slate-800'
                  : ''
              }
            >
              <Moon className="mr-2 h-4 w-4" /> Dark
            </SoftButton>
            <SoftButton
              onClick={() => setMode('system')}
              className={
                mode === 'system'
                  ? 'border-pink-200 bg-pink-50 text-pink-600 dark:bg-slate-800'
                  : ''
              }
            >
              <Monitor className="mr-2 h-4 w-4" /> Auto
            </SoftButton>
          </div>

          <p className="mb-8 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Sign in with Google to load your personal dashboard. Theme
            preferences can be changed here or later from the sidebar settings.
          </p>

          <ActionButton
            onClick={handleGoogleLogin}
            className="mb-4 flex w-full items-center justify-center"
          >
            <img
              className="mr-2 h-5 w-5 rounded-full bg-white"
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
            />
            Sign in with Google
          </ActionButton>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-100 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs text-slate-400">
              <span className="bg-[hsl(var(--background))] px-3">or</span>
            </div>
          </div>

          <SoftButton
            onClick={handleDevLogin}
            disabled={devLoading}
            className="w-full border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
          >
            {devLoading ? 'Logging in...' : 'Dev Login (skip OAuth)'}
          </SoftButton>
          <p className="mt-3 text-center text-xs text-slate-400">
            Dev mode only, not available in production.
          </p>
        </SurfaceCard>
      </div>
    </div>
  );
};

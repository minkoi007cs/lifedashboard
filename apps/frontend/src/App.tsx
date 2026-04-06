import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FinancePage } from './pages/FinancePage';
import { TasksPage } from './pages/TasksPage';
import { CaloriesPage } from './pages/CaloriesPage';
import { HabitsPage } from './pages/HabitsPage';
import { WishlistPage } from './pages/WishlistPage';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, isLoading, token } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="rounded-3xl border border-white/60 bg-white/70 px-8 py-7 text-center shadow-2xl shadow-orange-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-slate-950/40">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-pink-500"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function LoginSuccessHandler() {
  const { login } = useAuthStore();
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      login(token);
    }
  }, [token, login]);

  return <Navigate to="/" replace />;
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/login/success" element={<LoginSuccessHandler />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="focus" element={<Dashboard />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="calories" element={<CaloriesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

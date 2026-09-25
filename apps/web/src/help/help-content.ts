import dashboardHelp from './dashboard.html?raw';
import tasksHelp from './tasks.html?raw';
import wishlistHelp from './wishlist.html?raw';
import habitsHelp from './habits.html?raw';
import financeHelp from './finance.html?raw';
import caloriesHelp from './calories.html?raw';
import loginHelp from './login.html?raw';

export type HelpPageKey =
  | 'dashboard'
  | 'tasks'
  | 'wishlist'
  | 'habits'
  | 'finance'
  | 'calories'
  | 'login';

export const helpContentByPage: Record<HelpPageKey, string> = {
  dashboard: dashboardHelp,
  tasks: tasksHelp,
  wishlist: wishlistHelp,
  habits: habitsHelp,
  finance: financeHelp,
  calories: caloriesHelp,
  login: loginHelp,
};

export const helpTitleByPage: Record<HelpPageKey, string> = {
  dashboard: 'Dashboard Help',
  tasks: 'Tasks Help',
  wishlist: 'Wishlist Help',
  habits: 'Habits Help',
  finance: 'Finance Help',
  calories: 'Calories Help',
  login: 'Login Help',
};

export function getHelpPageKey(pathname: string): HelpPageKey {
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    return 'login';
  }
  if (pathname === '/tasks') {
    return 'tasks';
  }
  if (pathname === '/wishlist') {
    return 'wishlist';
  }
  if (pathname === '/habits') {
    return 'habits';
  }
  if (pathname === '/finance') {
    return 'finance';
  }
  if (pathname === '/calories') {
    return 'calories';
  }

  return 'dashboard';
}

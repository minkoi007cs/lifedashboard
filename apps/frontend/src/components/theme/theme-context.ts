import { createContext, useContext } from 'react';
import type { ThemePreset, ThemePresetDefinition } from './theme-presets';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  preset: ThemePreset;
  presetDefinition: ThemePresetDefinition;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ThemePreset) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

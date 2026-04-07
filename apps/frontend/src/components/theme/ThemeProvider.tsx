import React, { useEffect, useMemo, useState } from 'react';
import {
  ThemeContext,
  type ThemeMode,
} from './theme-context';
import { themePresets, type ThemePreset } from './theme-presets';

const STORAGE_KEY = 'lifedash-theme-mode';
const PRESET_STORAGE_KEY = 'lifedash-theme-preset';

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }

  return 'system';
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function getStoredPreset(): ThemePreset {
  if (typeof window === 'undefined') {
    return 'aurora';
  }

  const stored = window.localStorage.getItem(PRESET_STORAGE_KEY);
  if (themePresets.some((preset) => preset.value === stored)) {
    return stored as ThemePreset;
  }

  return 'aurora';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => getStoredMode());
  const [preset, setPreset] = useState<ThemePreset>(() => getStoredPreset());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    getSystemTheme(),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = () => {
      setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    window.localStorage.setItem(PRESET_STORAGE_KEY, preset);
  }, [preset]);

  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.themeMode = mode;
    root.dataset.themePreset = preset;
  }, [mode, preset, resolvedTheme]);

  const presetDefinition =
    themePresets.find((item) => item.value === preset) ?? themePresets[0];

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      preset,
      presetDefinition,
      setMode,
      setPreset,
    }),
    [mode, preset, presetDefinition, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

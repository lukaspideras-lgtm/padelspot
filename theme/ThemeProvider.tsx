import React, { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { themes } from './theme';

/**
 * Hook to get current theme colors.
 * Use in any component – re-renders when theme changes.
 */
export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  return themes[theme];
}

/**
 * ThemeProvider – ensure theme is hydrated on app start.
 * Call hydrate in root layout.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrate = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return <>{children}</>;
}

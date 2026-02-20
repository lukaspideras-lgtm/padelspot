// =============================================================================
// Theme store – persist dark/light mode
// =============================================================================

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/theme/theme';

const THEME_KEY = 'padelspot_theme';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  hydrate: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark',

  setTheme: (theme: ThemeMode) => {
    set({ theme });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
  },

  toggleTheme: () => {
    const next: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: next });
    AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
  },

  hydrate: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        set({ theme: stored });
      }
    } catch (_) {}
  },
}));

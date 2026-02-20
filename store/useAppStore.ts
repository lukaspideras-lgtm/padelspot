// =============================================================================
// Centralni Zustand store za PadelSpot
// =============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { User } from '@/types';
import * as authService from '@/src/services/auth';

const PENDING_VERIFY_KEY = 'padelspot_pending_verify_email';

interface AppState {
  currentUser: User | null;
  isLoading: boolean;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, firstName: string, lastName: string, phone: string, password: string) => Promise<{ success: boolean; error?: string; needsVerification?: boolean; email?: string }>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User | null) => void;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  isLoading: false,
  isHydrated: false,
  pendingVerificationEmail: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        const user = await authService.getCurrentUser();
        set({ currentUser: user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return result;
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: 'Greška pri prijavi.' };
    }
  },

  register: async (email: string, firstName: string, lastName: string, phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const result = await authService.register(email, firstName, lastName, phone, password);
      if (result.success && result.needsVerification && result.email) {
        await AsyncStorage.setItem(PENDING_VERIFY_KEY, result.email);
        set({ pendingVerificationEmail: result.email, isLoading: false });
      } else if (result.success) {
        const user = await authService.getCurrentUser();
        set({ currentUser: user, isLoading: false });
      } else {
        set({ isLoading: false });
      }
      return result;
    } catch (e) {
      set({ isLoading: false });
      return { success: false, error: 'Greška pri registraciji.' };
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore: local signOut should succeed; still clear local state below.
    } finally {
      set({ currentUser: null, isLoading: false });
    }
  },

  hydrate: async () => {
    try {
      const session = await authService.getSession();
      const pending = await AsyncStorage.getItem(PENDING_VERIFY_KEY);
      if (session) {
        const user = await authService.getCurrentUser();
        set({ currentUser: user, pendingVerificationEmail: null });
        if (pending) await AsyncStorage.removeItem(PENDING_VERIFY_KEY);
      } else {
        set({ currentUser: null, pendingVerificationEmail: pending });
      }
    } catch {
      set({ currentUser: null });
    } finally {
      set({ isHydrated: true });
    }
  },

  setUser: (user) => set({ currentUser: user }),

  setPendingVerificationEmail: async (email) => {
    set({ pendingVerificationEmail: email });
    if (email) await AsyncStorage.setItem(PENDING_VERIFY_KEY, email);
    else await AsyncStorage.removeItem(PENDING_VERIFY_KEY);
  },
}));

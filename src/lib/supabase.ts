// =============================================================================
// Supabase client – koristi EXPO_PUBLIC_ varijable (Expo učitava samo EXPO_PUBLIC_*)
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (__DEV__) {
  const hasUrl = !!supabaseUrl && supabaseUrl.length > 10;
  const hasKey = !!supabaseAnonKey && supabaseAnonKey.length > 10;
  // eslint-disable-next-line no-console
  console.log('[PadelSpot] Supabase config:', { hasUrl, hasKey });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

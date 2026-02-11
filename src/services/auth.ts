// =============================================================================
// Auth service – Supabase Auth + profiles (email verifikacija preko Resend)
// =============================================================================

import { supabase } from '@/src/lib/supabase';

import type { User } from '@/types';

const AUTH_CALLBACK_URL =
  process.env.EXPO_PUBLIC_AUTH_CALLBACK_URL ?? 'https://padelpotvrda.com/auth-callback.html';

export interface AuthResult {
  success: boolean;
  error?: string;
  /** Kad je true, korisnik mora da potvrdi email – prikaži verify-email ekran */
  needsVerification?: boolean;
  email?: string;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone: string
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, phone },
      emailRedirectTo: AUTH_CALLBACK_URL,
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
      return { success: false, error: 'Ovaj email je već registrovan. Prijavite se.' };
    }
    return { success: false, error: error.message };
  }
  if (data?.user && !data.session) {
    return { success: false, needsVerification: true, email };
  }
  return { success: true };
}

export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: AUTH_CALLBACK_URL },
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, role')
    .eq('id', user.id)
    .single();

  const p = profile as { first_name?: string; last_name?: string; phone?: string; role?: string } | null;
  const role = (p?.role ?? 'user') as User['role'];
  return {
    email: user.email,
    ime: p?.first_name ?? '',
    prezime: p?.last_name ?? '',
    telefon: p?.phone ?? '',
    role,
  };
}

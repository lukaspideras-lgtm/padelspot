// =============================================================================
// Auth service – Supabase Auth (OTP + password)
// =============================================================================

import { supabase } from '@/src/lib/supabase';
import type { User } from '@/types';

export interface AuthResult {
  success: boolean;
  error?: string;
  needsVerification?: boolean;
  email?: string;
}

function parseSupabaseError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message?: string }).message ?? '';
    if (msg.includes('phone_taken')) return 'Ovaj broj telefona je već u upotrebi.';
    if (msg.includes('Invalid login')) return 'Pogrešan email ili lozinka.';
    if (msg.includes('Email not confirmed')) return 'Potvrdite email putem poslatog koda.';
    return msg;
  }
  return 'Greška pri autentifikaciji.';
}

export async function register(
  email: string,
  firstName: string,
  lastName: string,
  phone: string,
  password: string
): Promise<AuthResult> {
  try {
    const { data: phoneOk, error: phoneErr } = await supabase.rpc('check_phone_available', {
      p_phone: phone,
    });
    if (phoneErr) return { success: false, error: parseSupabaseError(phoneErr) };
    if (phoneOk === false) return { success: false, error: 'Ovaj broj telefona je već u upotrebi.' };

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
        },
      },
    });
    if (error) return { success: false, error: parseSupabaseError(error) };
    // signUp success – session may be null if email confirmation required
    return { success: true, needsVerification: true, email: email.trim() };
  } catch (e) {
    return { success: false, error: parseSupabaseError(e) };
  }
}

export async function sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    if (error) return { success: false, error: parseSupabaseError(error) };
    return { success: true };
  } catch (e) {
    return { success: false, error: parseSupabaseError(e) };
  }
}

/** Resend signup confirmation OTP (after register with password) */
export async function resendSignupOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
    });
    if (error) return { success: false, error: parseSupabaseError(error) };
    return { success: true };
  } catch (e) {
    return { success: false, error: parseSupabaseError(e) };
  }
}

export async function verifyOtp(
  email: string,
  token: string,
  options?: { type?: 'email' | 'signup' }
): Promise<{ success: boolean; error?: string }> {
  try {
    const type = options?.type ?? 'email';
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type,
    });
    if (error) return { success: false, error: parseSupabaseError(error) };
    return { success: true };
  } catch (e) {
    return { success: false, error: parseSupabaseError(e) };
  }
}

export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { success: false, error: parseSupabaseError(error) };
    return { success: true };
  } catch (e) {
    return { success: false, error: parseSupabaseError(e) };
  }
}

export async function logout(): Promise<void> {
  // Use local scope to reliably clear session on device (no network required).
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw new Error(error.message);
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function setProfileHasSeenTutorial(): Promise<void> {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);
  if (!user) {
    throw new Error('no_user');
  }
  const { data: updatedRows, error } = await supabase
    .from('profiles')
    .update({ has_seen_tutorial: true })
    .eq('id', user.id)
    .select('id');
  if (error) {
    throw new Error(error.message);
  }

  // If no row was updated, the profile row may not exist yet. Upsert minimal row for this user.
  if (!updatedRows || updatedRows.length === 0) {
    const { error: upsertErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, has_seen_tutorial: true }, { onConflict: 'id' });
    if (upsertErr) {
      throw new Error(upsertErr.message);
    }
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('first_name, last_name, phone, role, has_seen_tutorial')
    .eq('id', authUser.id)
    .single();
  // ignore profileErr; fall back to metadata/defaults

  const meta = authUser.user_metadata ?? {};
  return {
    email: authUser.email ?? '',
    ime: profile?.first_name ?? meta.first_name ?? '',
    prezime: profile?.last_name ?? meta.last_name ?? '',
    telefon: profile?.phone ?? meta.phone ?? '',
    role: (profile?.role as 'user' | 'admin') ?? 'user',
    hasSeenTutorial: profile?.has_seen_tutorial ?? false,
  };
}

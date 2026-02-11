import { PrimaryButton, ScreenGradient } from '@/components/ui';
import { resendVerificationEmail } from '@/src/services/auth';
import { supabase } from '@/src/lib/supabase';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, StyleSheet, Text, View } from 'react-native';
import { useToastStore } from '@/store/useToastStore';
import { useAppStore } from '@/store/useAppStore';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { show: showToast } = useToastStore();
  const setUser = useAppStore((s) => s.setUser);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const { email } = useLocalSearchParams<{ email: string }>();
  const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] : '';
  const doneRef = useRef(false);

  const tryFetchSession = useCallback(async (): Promise<boolean> => {
    if (!emailStr || doneRef.current) return false;
    const emailNorm = emailStr.trim().toLowerCase();
    const { data, error } = await supabase.rpc('get_pending_session_for_email', { p_email: emailNorm });
    if (error) {
      if (__DEV__) console.warn('[verify-email] RPC error:', error);
      return false;
    }
    const obj = Array.isArray(data) ? data[0] : data;
    const at = obj && typeof obj === 'object' ? (obj as { access_token?: string }).access_token : null;
    const rt = obj && typeof obj === 'object' ? (obj as { refresh_token?: string }).refresh_token : null;
    if (!at || !rt) return false;
    doneRef.current = true;
    try {
      const { data: sessionData } = await supabase.auth.setSession({
        access_token: at,
        refresh_token: rt,
      });
      if (sessionData.user) {
        const meta = sessionData.user.user_metadata ?? {};
        setUser({
          email: sessionData.user.email ?? '',
          ime: meta.first_name ?? '',
          prezime: meta.last_name ?? '',
          telefon: meta.phone ?? '',
          role: 'user',
        });
      }
      router.replace('/(tabs)/reserve');
      return true;
    } catch (e) {
      doneRef.current = false;
      showToast('Greška pri potvrdi. Zatražite novi link.', 'error');
      return false;
    }
  }, [emailStr, setUser, router, showToast]);

  useEffect(() => {
    if (!emailStr) return;
    tryFetchSession();
    const iv = setInterval(tryFetchSession, 600);
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        tryFetchSession();
        setTimeout(tryFetchSession, 500);
        setTimeout(tryFetchSession, 1200);
        setTimeout(tryFetchSession, 2500);
      }
    });
    return () => {
      clearInterval(iv);
      sub.remove();
    };
  }, [emailStr, tryFetchSession]);

  const handleCheckAgain = async () => {
    if (!emailStr || isChecking) return;
    setIsChecking(true);
    const ok = await tryFetchSession();
    setIsChecking(false);
    if (!ok) showToast('Sesija nije pronađena. Da li ste videli "Nalog je potvrđen" u browseru? Probajte ponovo.', 'error');
  };

  const handleResend = async () => {
    if (!emailStr || isResending) return;
    setIsResending(true);
    const result = await resendVerificationEmail(emailStr);
    setIsResending(false);
    if (result.success) {
      showToast('Email je ponovo poslat. Proverite poštanski sandučić.', 'success');
    } else {
      showToast(result.error ?? 'Greška pri slanju.', 'error');
    }
  };

  return (
    <ScreenGradient>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Potvrdite email</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Poslali smo vam link na adresu{'\n'}
          <Text style={[styles.email, { color: theme.tint }]}>{emailStr}</Text>
        </Text>
        <Text style={[styles.instruction, { color: theme.textSecondary }]}>
          Kliknite na link u emailu. Sačekajte da vidite „Nalog je potvrđen“ u browseru, pa se vratite ovde. Bićete automatski ulogovani.
        </Text>
        <Text style={[styles.phoneHint, { color: theme.textSecondary }]}>
          Link ističe za 1 sat.
        </Text>
        <PrimaryButton
          title={isChecking ? 'Proveravam...' : 'Kliknuo sam link – proveri ponovo'}
          onPress={handleCheckAgain}
          variant="outline"
          loading={isChecking}
          disabled={isChecking}
          style={styles.checkBtn}
        />
        <PrimaryButton
          title={isResending ? 'Šaljem...' : 'Pošalji ponovo'}
          onPress={handleResend}
          loading={isResending}
          disabled={isResending}
          style={styles.resendBtn}
        />
        <PrimaryButton
          title="Nazad na prijavu"
          onPress={() => router.replace('/auth/login')}
          variant="outline"
          style={styles.backBtn}
        />
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    ...typography.headline,
    fontSize: 26,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    ...typography.subtitle,
  },
  instruction: {
    ...typography.body,
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  phoneHint: {
    ...typography.caption,
    fontSize: 12,
    marginBottom: 24,
    textAlign: 'center',
  },
  checkBtn: { marginBottom: 12 },
  resendBtn: { marginBottom: 12 },
  backBtn: {},
});

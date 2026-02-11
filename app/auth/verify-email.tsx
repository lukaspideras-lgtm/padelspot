import { PrimaryButton, ScreenGradient } from '@/components/ui';
import { resendVerificationEmail } from '@/src/services/auth';
import { supabase } from '@/src/lib/supabase';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useToastStore } from '@/store/useToastStore';
import { useAppStore } from '@/store/useAppStore';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { show: showToast } = useToastStore();
  const setUser = useAppStore((s) => s.setUser);
  const [isResending, setIsResending] = useState(false);
  const { email } = useLocalSearchParams<{ email: string }>();
  const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] : '';

  useEffect(() => {
    if (!emailStr) return;
    const iv = setInterval(async () => {
      const { data } = await supabase.rpc('get_pending_session_for_email', { p_email: emailStr });
      if (data?.access_token && data?.refresh_token) {
        clearInterval(iv);
        try {
          const { data: sessionData } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
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
        } catch {
          showToast('Greška pri potvrdi.', 'error');
        }
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [emailStr, setUser, router, showToast]);

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
          Kliknite na link u emailu da aktivirate nalog. Otvorite link na telefonu gde je app instaliran. Zatim se vratite u aplikaciju – bićete automatski ulogovani.
        </Text>
        <Text style={[styles.phoneHint, { color: theme.textSecondary }]}>
          Link ističe za 1 sat.
        </Text>
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
  resendBtn: { marginBottom: 12 },
  backBtn: {},
});

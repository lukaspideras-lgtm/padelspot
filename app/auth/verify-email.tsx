import { PrimaryButton, ScreenGradient, TextField } from '@/components/ui';
import { getCurrentUser, resendSignupOtp, sendOtp, verifyOtp } from '@/src/services/auth';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useToastStore } from '@/store/useToastStore';
import { useAppStore } from '@/store/useAppStore';

const OTP_REGEX = /(\d{6,8})/;

const RESEND_COOLDOWN_SEC = 30;

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const { show: showToast } = useToastStore();
  const setUser = useAppStore((s) => s.setUser);
  const setPendingVerificationEmail = useAppStore((s) => s.setPendingVerificationEmail);
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { email, fromSignup } = useLocalSearchParams<{ email: string; fromSignup?: string }>();
  const emailStr = typeof email === 'string' ? email : Array.isArray(email) ? email[0] : '';
  const isFromSignup = fromSignup === 'true';

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const otpTrimmed = otp.trim();
  const isOtpValid = otpTrimmed.length >= 6 && otpTrimmed.length <= 8;

  const handleVerify = async (codeOverride?: unknown) => {
    // If bound directly to a Pressable onPress, React Native passes an event object.
    const source = typeof codeOverride === 'string' ? codeOverride : otp;
    const raw = String(source ?? '').trim();
    const code = raw.replace(/[^0-9]/g, '').slice(0, 8);
    if (code.length < 6) {
      showToast('Kod je 6–8 cifara', 'error');
      return;
    }
    if (!emailStr || isVerifying) return;
    setIsVerifying(true);
    const result = await verifyOtp(emailStr, code, { type: isFromSignup ? 'signup' : 'email' });
    setIsVerifying(false);
    if (result.success) {
      await setPendingVerificationEmail(null);
      const user = await getCurrentUser();
      if (user) setUser(user);
      router.replace('/(tabs)/reserve');
    } else {
      showToast(result.error ?? 'Pogrešan kod. Pokušajte ponovo.', 'error');
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = String(await Clipboard.getStringAsync() ?? '');
      const match = text.match(OTP_REGEX);
      if (match) {
        const code = match[1].slice(0, 8);
        setOtp(code);
        if (code.length >= 6 && code.length <= 8) {
          handleVerify(code);
        }
      } else {
        showToast('U clipboardu nema koda', 'error');
      }
    } catch {
      showToast('U clipboardu nema koda', 'error');
    }
  };

  const handleResend = async () => {
    if (!emailStr || isResending || resendCooldown > 0) return;
    setIsResending(true);
    const result = isFromSignup ? await resendSignupOtp(emailStr) : await sendOtp(emailStr);
    setIsResending(false);
    if (result.success) {
      setResendCooldown(RESEND_COOLDOWN_SEC);
      showToast('Novi kod je poslat. Proverite email.', 'success');
    } else {
      showToast(result.error ?? 'Greška pri slanju. Pokušajte ponovo za minutu.', 'error');
    }
  };

  if (!emailStr) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <ScreenGradient>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>Potvrdite email</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Poslali smo vam kod (6–8 cifara) na{'\n'}
          <Text style={[styles.email, { color: theme.tint }]}>{emailStr}</Text>
        </Text>
        <Text style={[styles.instruction, { color: theme.textSecondary }]}>
          Unesite kod iz emaila ispod.
        </Text>
        <TextField
          label="Kod"
          value={otp}
          onChangeText={(t) => setOtp(String(t ?? '').replace(/[^0-9]/g, '').slice(0, 8))}
          placeholder="Unesite kod (6–8 cifara)"
          keyboardType="number-pad"
          maxLength={8}
          error={
            otpTrimmed.length > 0 && !isOtpValid
              ? 'Kod je 6–8 cifara'
              : undefined
          }
          containerStyle={styles.otpInput}
        />
        <PrimaryButton
          title="Nalepi kod"
          onPress={handlePasteCode}
          variant="outline"
          style={styles.pasteBtn}
        />
        <PrimaryButton
          title={isVerifying ? 'Proveravam...' : 'Potvrdi'}
          onPress={handleVerify}
          loading={isVerifying}
          disabled={isVerifying || !isOtpValid}
          style={styles.verifyBtn}
        />
        <PrimaryButton
          title={
            isResending
              ? 'Šaljem...'
              : resendCooldown > 0
                ? `Pošalji novi kod (${resendCooldown}s)`
                : 'Pošalji novi kod'
          }
          onPress={handleResend}
          variant="outline"
          loading={isResending}
          disabled={isResending || resendCooldown > 0}
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
    marginBottom: 16,
    textAlign: 'center',
  },
  otpInput: {
    marginBottom: 12,
  },
  pasteBtn: { marginBottom: 12 },
  verifyBtn: { marginBottom: 12 },
  resendBtn: { marginBottom: 12 },
  backBtn: {},
});

import { PrimaryButton, ScreenGradient, TextField } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/store/useThemeStore';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LogoDefault = require('@/assets/images/logo.png');
const LogoZelen = require('@/assets/images/PADEL-SPOT-LogoZelen.png');

export default function LoginScreen() {
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.theme);
  const logoSource = themeMode === 'light' ? LogoZelen : LogoDefault;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { login, isLoading } = useAppStore();

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Unesite email.';
    else if (!isValidEmail(email)) next.email = 'Unesite ispravan email.';
    if (!password) next.password = 'Unesite lozinku.';
    else if (password.length < 6) next.password = 'Lozinka mora imati najmanje 6 karaktera.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    const result = await login(email.trim(), password);
    if (result.success) router.replace('/(tabs)/reserve');
    else setErrors({ password: result.error });
  };

  return (
    <ScreenGradient>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Image source={logoSource} style={[styles.logo, { backgroundColor: 'transparent' }]} resizeMode="contain" />
          </View>
          <View style={styles.form}>
          <Text style={[styles.title, { color: theme.text }]}>Prijava</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Unesite podatke za prijavu</Text>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="email@ primer.rs"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
          />
          <TextField
            label="Lozinka"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />
          <PrimaryButton
            title="Prijavi se"
            onPress={handleLogin}
            loading={isLoading}
            style={styles.button}
            textStyle={{ color: '#fff' }}
          />
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Nemate nalog? </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={[styles.link, { color: '#22c55e' }]}>Registrujte se</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60, paddingBottom: 48, alignItems: 'center' },
  form: { width: '100%' },
  logoWrap: { width: '100%', height: 220, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 230, height: 260 },
  title: { fontFamily: 'Oswald-Bold', fontSize: 28, marginBottom: 8, alignSelf: 'stretch' },
  subtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 24, alignSelf: 'stretch' },
  button: { marginTop: 8, marginBottom: 24, alignSelf: 'stretch' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontFamily: 'Montserrat-Regular', fontSize: 15 },
  link: { fontFamily: 'Montserrat-SemiBold', fontSize: 15 },
});

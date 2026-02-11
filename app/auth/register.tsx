import { PrimaryButton, ScreenGradient, TextField } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/store/useThemeStore';
import { isValidPhone } from '@/utils/phoneValidation';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const LogoDefault = require('@/assets/images/logo.png');
const LogoZelen = require('@/assets/images/PADEL-SPOT-LogoZelen.png');

export default function RegisterScreen() {
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.theme);
  const logoSource = themeMode === 'light' ? LogoZelen : LogoDefault;
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { register, isLoading } = useAppStore();

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Unesite email.';
    else if (!isValidEmail(email)) next.email = 'Unesite ispravan email.';
    if (!firstName.trim()) next.firstName = 'Unesite ime.';
    if (!lastName.trim()) next.lastName = 'Unesite prezime.';
    if (!phone.trim()) next.phone = 'Unesite broj telefona.';
    else if (!isValidPhone(phone)) next.phone = 'Unesite ispravan broj telefona.';
    if (!password) next.password = 'Unesite lozinku.';
    else if (password.length < 6) next.password = 'Lozinka mora imati najmanje 6 karaktera.';
    if (password !== confirmPassword) next.confirmPassword = 'Lozinke se ne poklapaju.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    const result = await register(
      email.trim(),
      password,
      confirmPassword,
      firstName.trim(),
      lastName.trim(),
      phone.trim()
    );
    if (result.success) {
      router.replace('/(tabs)/reserve');
    } else if (result.needsVerification && result.email) {
      router.push({ pathname: '/auth/verify-email', params: { email: result.email } });
    } else {
      const err = result.error ?? 'Greška pri registraciji.';
      const isPhoneErr = err.includes('telefona');
      setErrors(isPhoneErr ? { phone: err } : { password: err });
    }
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
          <Text style={[styles.title, { color: theme.text }]}>Registracija</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Kreirajte novi nalog</Text>
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
            label="Ime"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Vaše ime"
            autoCapitalize="words"
            error={errors.firstName}
          />
          <TextField
            label="Prezime"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Vaše prezime"
            autoCapitalize="words"
            error={errors.lastName}
          />
          <TextField
            label="Broj telefona"
            value={phone}
            onChangeText={setPhone}
            placeholder="+3816... ili 06..."
            keyboardType="phone-pad"
            error={errors.phone}
          />
          <TextField
            label="Lozinka"
            value={password}
            onChangeText={setPassword}
            placeholder="Najmanje 6 karaktera"
            secureTextEntry
            error={errors.password}
          />
          <TextField
            label="Potvrdi lozinku"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Ponovite lozinku"
            secureTextEntry
            error={errors.confirmPassword}
          />
          <PrimaryButton
            title="Registruj se"
            onPress={handleRegister}
            loading={isLoading}
            style={styles.button}
            textStyle={{ color: '#fff' }}
          />
          </View>
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>Već imate nalog? </Text>
            <Pressable onPress={() => router.push('/auth/login')}>
              <Text style={[styles.link, { color: '#22c55e' }]}>Prijavite se</Text>
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

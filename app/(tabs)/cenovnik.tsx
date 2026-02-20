import { ScreenGradient } from '@/components/ui';
import {
  PRICE_RACKET,
  PRICE_WEEKDAY_08_17,
  PRICE_WEEKDAY_18_24,
  PRICE_WEEKEND_08_17,
  PRICE_WEEKEND_18_24,
} from '@/constants/pricing';
import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/store/useThemeStore';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

const LogoDefault = require('@/assets/images/logo.png');
const LogoZelen = require('@/assets/images/PADEL-SPOT-LogoZelen.png');

export default function CenovnikScreen() {
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.theme);
  const logoSource = themeMode === 'light' ? LogoZelen : LogoDefault;
  return (
    <ScreenGradient>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Image source={logoSource} style={[styles.logo, { backgroundColor: 'transparent' }]} resizeMode="contain" />
        <Text style={[styles.title, { color: theme.text }]}>Cenovnik</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Cene po satu za iznajmljivanje terena</Text>

        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.courtBlue, backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Radni dani (Pon–Pet)</Text>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTime, { color: theme.text }]}>08:00 – 17:00</Text>
            <Text style={[styles.cardPrice, { color: theme.text }]}>{PRICE_WEEKDAY_08_17} din/sat</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTime, { color: theme.text }]}>18:00 – 24:00</Text>
            <Text style={[styles.cardPrice, { color: theme.text }]}>{PRICE_WEEKDAY_18_24} din/sat</Text>
          </View>
        </View>

        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.courtBlue, backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Vikend (Sub–Ned)</Text>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTime, { color: theme.text }]}>08:00 – 17:00</Text>
            <Text style={[styles.cardPrice, { color: theme.text }]}>{PRICE_WEEKEND_08_17} din/sat</Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={[styles.cardTime, { color: theme.text }]}>18:00 – 24:00</Text>
            <Text style={[styles.cardPrice, { color: theme.text }]}>{PRICE_WEEKEND_18_24} din/sat</Text>
          </View>
        </View>

        <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: theme.courtGreen, backgroundColor: theme.surface }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Iznajmljivanje reketa</Text>
          <Text style={[styles.cardPrice, { color: theme.text }]}>{PRICE_RACKET} din</Text>
        </View>
      </ScrollView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  logo: { width: 400, height: 125, marginBottom: 20, alignSelf: 'center' },
  title: {
    ...typography.title,
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.body,
    marginBottom: 24,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    ...typography.subtitle,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTime: { ...typography.body, fontSize: 15 },
  cardPrice: { ...typography.price },
});

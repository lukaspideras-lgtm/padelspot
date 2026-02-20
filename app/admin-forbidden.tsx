import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, ScreenGradient } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function AdminForbiddenScreen() {
  const theme = useTheme();
  return (
    <ScreenGradient>
    <View style={styles.container}>
        <Text style={[styles.title, { color: theme.text }]}>
          Nemate dozvolu pristupa.
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Samo administratori mogu pristupiti ovoj stranici.
        </Text>
        <PrimaryButton
          title="Nazad"
          onPress={() => router.back()}
          style={styles.button}
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
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
  },
});

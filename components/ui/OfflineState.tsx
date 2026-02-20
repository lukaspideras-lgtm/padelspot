import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

interface OfflineStateProps {
  /** TODO: Later connect to real network/backend status - use NetInfo or similar */
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onRetry?: () => void;
}

export function OfflineState({
  title = 'Nema interneta',
  subtitle = 'Proverite konekciju i pokušajte ponovo.',
  buttonText = 'Pokušaj ponovo',
  onRetry,
}: OfflineStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {subtitle}
      </Text>
      {onRetry && (
        <PrimaryButton
          title={buttonText}
          onPress={onRetry}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {},
});

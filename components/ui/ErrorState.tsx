import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

interface ErrorStateProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Nešto nije u redu',
  subtitle = 'Pokušajte ponovo.',
  buttonText = 'Pokušaj ponovo',
  onRetry,
}: ErrorStateProps) {
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

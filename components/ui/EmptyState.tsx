import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = 'Nema rezervacija.' }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: theme.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  text: {
    ...typography.body,
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';

interface PriceSummaryProps {
  totalPrice: number;
  addRacket?: boolean;
}

export function PriceSummary({ totalPrice, addRacket }: PriceSummaryProps) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface }]}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Ukupno</Text>
      <Text style={[styles.price, { color: theme.text }]}>{totalPrice} din</Text>
      {addRacket && (
        <Text style={[styles.racketNote, { color: theme.textSecondary }]}>+ Iznajmljivanje reketa: 300 din</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { ...typography.body },
  price: { ...typography.price, fontSize: 24 },
  racketNote: { ...typography.caption, marginTop: 4 },
});

import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from './PrimaryButton';
import { useTheme } from '@/theme/ThemeProvider';

interface StickyBookingBarProps {
  courtName: string;
  dateLabel: string;
  timeLabel: string;
  durationLabel: string;
  totalPrice: number;
  onReserve: () => void;
  disabled?: boolean;
  /** Kada nema izbora – prikaži hint umesto podataka */
  isEmpty?: boolean;
  /** Boja za dugme (theme.tint ako nije prosleđeno) */
  accentColor?: string;
}

export function StickyBookingBar({
  courtName,
  dateLabel,
  timeLabel,
  durationLabel,
  totalPrice,
  onReserve,
  disabled = false,
  isEmpty = false,
  accentColor,
}: StickyBookingBarProps) {
  const theme = useTheme();
  const btnColor = accentColor ?? theme.tint;
  const insets = useSafeAreaInsets();

  if (isEmpty) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}>
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          Izaberite termin
        </Text>
        <PrimaryButton
          title="Rezerviši"
          onPress={() => {}}
          disabled
          style={[styles.btn, { backgroundColor: theme.border }]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Teren</Text>
        <Text style={[styles.value, { color: theme.text }]}>{courtName}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Datum</Text>
        <Text style={[styles.value, { color: theme.text }]}>{dateLabel}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Vreme</Text>
        <Text style={[styles.value, { color: theme.text }]}>{timeLabel}</Text>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Trajanje</Text>
        <Text style={[styles.value, { color: theme.text }]}>{durationLabel}</Text>
      </View>
      <View style={[styles.row, styles.totalRow]}>
        <Text style={[styles.totalLabel, { color: theme.text }]}>Ukupno</Text>
        <Text style={[styles.totalValue, { color: theme.text }]}>{totalPrice} din</Text>
      </View>
      <PrimaryButton
        title="Rezerviši"
        onPress={onReserve}
        disabled={disabled}
        style={[styles.btn, { backgroundColor: btnColor }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalRow: {
    marginTop: 4,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.caption },
  value: { ...typography.subtitle, fontSize: 14 },
  totalLabel: { ...typography.subtitle, fontSize: 15 },
  totalValue: { ...typography.price, fontSize: 16 },
  hint: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: 12,
  },
  btn: {},
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { PrimaryButton } from './PrimaryButton';
import { EmptyState } from './EmptyState';
import { useTheme } from '@/theme/ThemeProvider';
import { formatTimeForDisplay } from '@/utils/time';
import type { TimeSlot } from '@/constants/times';

interface SlotListProps {
  courtAccentColor: string;
  durationMinutes: 60 | 120;
  availableStarts: string[];
  onSelectSlot: (startTime: string, endTime: string) => void;
  selectedSlot: { start: string; end: string } | null;
}

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const totalM = h * 60 + m + minutes;
  if (totalM === 1440) return '24:00';
  const nh = Math.floor(totalM / 60) % 24;
  const nm = totalM % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

export function SlotList({
  courtAccentColor,
  durationMinutes,
  availableStarts,
  onSelectSlot,
  selectedSlot,
}: SlotListProps) {
  const theme = useTheme();

  const slots: TimeSlot[] = availableStarts.map((start) => ({
    start,
    end: addMinutesToTime(start, durationMinutes),
  }));

  if (slots.length === 0) {
    return (
      <EmptyState message="Nema slobodnih termina za izabrani dan." />
    );
  }

  return (
    <View style={styles.list}>
      {slots.map((item) => {
        const isSelected = selectedSlot?.start === item.start;
        return (
          <View
            key={item.start}
            style={[
              styles.row,
              {
                backgroundColor: isSelected ? `${courtAccentColor}33` : theme.surface,
                borderColor: isSelected ? courtAccentColor : theme.border,
              },
            ]}>
            <Text
              style={[styles.timeText, { color: theme.text }]}>
              {formatTimeForDisplay(item.start)} – {formatTimeForDisplay(item.end)}
            </Text>
            <PrimaryButton
              title={isSelected ? 'Izabrano' : 'Izaberi'}
              onPress={() => onSelectSlot(item.start, item.end)}
              variant={isSelected ? 'primary' : 'outline'}
              style={[
                styles.reserveBtn,
                isSelected
                  ? { backgroundColor: courtAccentColor, borderColor: courtAccentColor }
                  : { borderColor: courtAccentColor },
              ]}
              textStyle={!isSelected ? { color: courtAccentColor } : undefined}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  timeText: { ...typography.body, fontSize: 16 },
  reserveBtn: { minWidth: 100 },
});

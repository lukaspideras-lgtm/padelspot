import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { COURTS } from '@/constants/courts';

export interface CourtOption {
  id: string;
  name: string;
  color: string;
}

interface CourtListProps {
  courts?: CourtOption[];
  selectedCourtId: string | null;
  onSelect: (courtId: string) => void;
}

const FALLBACK_COURTS: CourtOption[] = COURTS.map((c) => ({
  id: c.id,
  name: c.name,
  color: c.color,
}));

export function CourtList({ courts = FALLBACK_COURTS, selectedCourtId, onSelect }: CourtListProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {courts.map((court) => {
        const isSelected = selectedCourtId === court.id;
        return (
          <Pressable
            key={court.id}
            onPress={() => onSelect(court.id)}
            style={[
              styles.row,
              {
                backgroundColor: isSelected ? theme.surface : theme.surfaceMuted,
                borderColor: isSelected ? court.color : 'transparent',
                borderWidth: isSelected ? 2 : 0,
              },
            ]}>
            <View style={[styles.dot, { backgroundColor: court.color || theme.tint }]} />
            <Text style={[styles.courtText, { color: theme.text }]}>{court.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  courtText: { ...typography.body, fontSize: 16 },
});

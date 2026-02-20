import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { COURTS } from '@/constants/courts';
import { useTheme } from '@/theme/ThemeProvider';

interface CourtSelectorProps {
  selectedCourtId: string | null;
  onSelect: (courtId: string) => void;
}

export function CourtSelector({ selectedCourtId, onSelect }: CourtSelectorProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {COURTS.map((court) => {
        const isSelected = selectedCourtId === court.id;
        return (
          <Pressable
            key={court.id}
            onPress={() => onSelect(court.id)}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? theme.surface : theme.surfaceMuted,
                borderColor: isSelected ? court.color : theme.border,
                borderWidth: 2,
              },
            ]}>
            <View style={[styles.dot, { backgroundColor: court.color }]} />
            <Text
              style={[
                styles.chipText,
                {
                  color: theme.text,
                  fontWeight: isSelected ? '600' : '500',
                },
              ]}>
              {court.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    ...typography.body,
  },
});

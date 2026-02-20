import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

type Duration = 60 | 120;

interface DurationToggleProps {
  value: Duration;
  onChange: (v: Duration) => void;
}

export function DurationToggle({ value, onChange }: DurationToggleProps) {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange(60)}
        style={[
          styles.option,
          { backgroundColor: value === 60 ? theme.surface : theme.surfaceMuted },
        ]}>
        <Text style={[styles.optionText, { color: theme.text }]}>1h</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(120)}
        style={[
          styles.option,
          { backgroundColor: value === 120 ? theme.surface : theme.surfaceMuted },
        ]}>
        <Text style={[styles.optionText, { color: theme.text }]}>2h</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  option: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';

const BAR_HEIGHT = 72;

interface BookingMiniBarProps {
  onContinue: () => void;
  isEmpty?: boolean;
  accentColor?: string;
}

export function BookingMiniBar({
  onContinue,
  isEmpty = true,
  accentColor,
}: BookingMiniBarProps) {
  const theme = useTheme();
  const accent = accentColor ?? theme.tint;

  const barInner = (
    <View
      style={[
        styles.barInner,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
      ]}>
      {isEmpty ? (
        <Text style={[styles.hintText, { color: theme.text }]}>
          Izaberite termin
        </Text>
      ) : (
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => [
            styles.reserveBtn,
            { backgroundColor: accent, opacity: pressed ? 0.9 : 1 },
          ]}>
          <Text style={styles.reserveBtnText}>Rezerviši</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView
      edges={[]}
      style={[styles.barOuter, { height: BAR_HEIGHT }]}>
      {barInner}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  barOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'visible',
  },
  barInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  hintText: {
    ...typography.title,
    fontSize: 18,
    textAlign: 'center',
  },
  reserveBtn: {
    height: 48,
    width: '90%',
    maxWidth: 420,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reserveBtnText: {
    ...typography.button,
    fontSize: 18,
    textAlign: 'center',
    color: '#FFF',
  },
});

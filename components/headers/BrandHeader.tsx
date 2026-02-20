import { typography } from '@/src/theme/typography';
import { useTheme } from '@/theme/ThemeProvider';
import { useThemeStore } from '@/store/useThemeStore';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LogoNOBG = require('@/assets/images/PADEL-SPOT-LogoNOBG.png');
const LogoNoLetters = require('@/assets/images/PADEL-SPOT-LogoNoLetters.png');

export function BrandHeader() {
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();
  const logoSource = themeMode === 'light' ? LogoNOBG : LogoNoLetters;
  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top, borderBottomColor: theme.border }]}>
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={[styles.text, { color: themeMode === 'light' ? '#8dbc3f' : theme.text }]}>Padel Spot</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 90,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  logo: {
    position: 'absolute',
    left: 85,
    top: 45,
    width: 34,
    height: 34,
    backgroundColor: 'transparent',
  },
  text: {
    ...typography.headline,
    fontSize: 29,
    letterSpacing: 0.3,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 35,
    textAlign: 'center',
  },
});

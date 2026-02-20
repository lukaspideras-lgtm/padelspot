import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';

interface ScreenGradientProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const theme = useTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: theme.background }, style]}>
      {children}
    </View>
  );
}

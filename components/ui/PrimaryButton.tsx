import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Insets,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
  hitSlop?: Insets;
}

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
  textStyle,
  hitSlop,
}: PrimaryButtonProps) {
  const theme = useTheme();
  const bgColor =
    variant === 'primary'
      ? theme.tint
      : variant === 'outline'
      ? 'transparent'
      : theme.border;
  const textColor =
    variant === 'primary' ? '#fff' : variant === 'outline' ? theme.tint : theme.text;
  const borderColor = variant === 'outline' ? theme.tint : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bgColor,
          borderColor,
          borderWidth: variant === 'outline' ? 2 : 0,
          opacity: disabled ? 0.6 : pressed ? 0.9 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
});

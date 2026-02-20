import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { typography } from '@/src/theme/typography';
import { useToastStore } from '@/store/useToastStore';
import { useTheme } from '@/theme/ThemeProvider';

export function Toast() {
  const theme = useTheme();
  const { message, type, hide } = useToastStore();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => hide());
  }, [message]);

  if (!message) return null;

  const bgColor = type === 'success' ? theme.success : type === 'error' ? theme.error : theme.tint;

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor },
        { opacity },
      ]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 9999,
  },
  text: {
    ...typography.body,
    fontSize: 15,
    textAlign: 'center',
    color: '#fff',
  },
});

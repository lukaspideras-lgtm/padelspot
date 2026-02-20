import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';

interface SuccessOverlayProps {
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
}

export function SuccessOverlay({
  visible,
  onDismiss,
  duration = 1500,
}: SuccessOverlayProps) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const animatingRef = useRef(false);

  useEffect(() => {
    if (!visible) return;
    if (animatingRef.current) return;
    animatingRef.current = true;

    opacity.setValue(0);
    scale.setValue(0.8);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        animatingRef.current = false;
        onDismiss();
      });
    }, duration);

    return () => clearTimeout(t);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity,
        },
      ]}
      pointerEvents="none">
      <Animated.View
        style={[
          styles.content,
          { backgroundColor: theme.surface, transform: [{ scale }] },
        ]}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark-circle" size={64} color={theme.success} />
        </View>
        <Text style={[styles.text, { color: theme.text }]}>Uspešno rezervisano!</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  iconWrap: {
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';
import { typography } from '@/src/theme/typography';

interface ScreenHeaderProps {
  title: string;
}

export function ScreenHeader({ title }: ScreenHeaderProps) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { borderBottomColor: theme.border }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        hitSlop={12}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </Pressable>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  title: {
    flex: 1,
    ...typography.subtitle,
    fontSize: 17,
  },
  spacer: {
    width: 36,
  },
});

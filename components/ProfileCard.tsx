import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from './Avatar';
import { useTheme } from '@/theme/ThemeProvider';
import type { User } from '@/types';

function getInitials(user: User): string {
  const first = (user.ime ?? '').trim();
  const last = (user.prezime ?? '').trim();
  if (first && last) return (first.charAt(0) + last.charAt(0)).toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase() || first.charAt(0).toUpperCase();
  if (last) return last.slice(0, 2).toUpperCase() || last.charAt(0).toUpperCase();
  return user.email?.charAt(0)?.toUpperCase() || '?';
}

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={styles.row}>
        <Avatar initials={getInitials(user)} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: theme.text }]}>
            {[user.ime, user.prezime].filter(Boolean).join(' ') || user.email}
          </Text>
          <Text style={[styles.field, { color: theme.textSecondary }]}>
            {user.telefon}
          </Text>
          <Text style={[styles.field, { color: theme.textSecondary }]}>
            {user.email}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.title,
    fontSize: 18,
    marginBottom: 4,
  },
  field: {
    ...typography.body,
    marginBottom: 2,
  },
});

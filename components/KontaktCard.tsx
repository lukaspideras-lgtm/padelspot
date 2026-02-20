import React from 'react';
import { typography } from '@/src/theme/typography';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme/ThemeProvider';

const CONTACT_ROWS = [
  {
    icon: 'call' as const,
    label: 'Telefon',
    value: '060 5600300',
    url: 'tel:0605600300',
  },
  {
    icon: 'logo-instagram' as const,
    label: 'Instagram',
    value: '@padel_spot_nis',
    url: 'https://instagram.com/padel_spot_nis',
  },
  {
    icon: 'location' as const,
    label: 'Adresa',
    value: 'Padel Spot',
    subValue: 'Knjaževačka bb, Niš, Serbia, 18000',
    url: 'https://maps.app.goo.gl/mNKmuUtQcqia2bsR8',
  },
  {
    icon: 'globe' as const,
    label: 'Sajt',
    value: 'padelspot.rs',
    url: 'https://padelspot.rs/',
  },
];

export function KontaktCard() {
  const theme = useTheme();

  const handlePress = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <Text
        style={[
          styles.title,
          { color: theme.textSecondary },
        ]}>
        KONTAKT
      </Text>
      {CONTACT_ROWS.map((row, index) => (
        <Pressable
          key={row.label}
          onPress={() => handlePress(row.url)}
          style={({ pressed }) => [
            styles.row,
            {
              borderTopWidth: index > 0 ? 1 : 0,
              borderTopColor: theme.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}>
          <View style={styles.iconWrap}>
            <Ionicons
              name={row.icon}
              size={22}
              color={theme.tint}
            />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              {row.label}
            </Text>
            <Text style={[styles.value, { color: theme.text }]} numberOfLines={1}>
              {row.value}
            </Text>
            {row.subValue ? (
              <Text
                style={[styles.subValue, { color: theme.textSecondary }]}
                numberOfLines={1}>
                {row.subValue}
              </Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    ...typography.overline,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  iconWrap: {
    width: 36,
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  label: {
    ...typography.caption,
    marginBottom: 2,
  },
  value: {
    ...typography.subtitle,
    fontSize: 15,
  },
  subValue: {
    ...typography.caption,
    marginTop: 2,
  },
});

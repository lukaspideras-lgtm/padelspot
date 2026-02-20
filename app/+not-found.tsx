import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { typography } from '@/src/theme/typography';
import { ScreenGradient } from '@/components/ui';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotFoundScreen() {
  const theme = useTheme();
  return (
    <ScreenGradient>
      <>
        <Stack.Screen options={{ title: 'Stranica nije pronađena' }} />
        <View style={styles.container}>
          <Text style={[styles.title, { color: theme.text }]}>Ova stranica ne postoji.</Text>
          <Link href="/" style={styles.link}>
            <Text style={[styles.linkText, { color: theme.tint }]}>Nazad na početnu</Text>
          </Link>
        </View>
      </>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    ...typography.title,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    ...typography.subtitle,
  },
});

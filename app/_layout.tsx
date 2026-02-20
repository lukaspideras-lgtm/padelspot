import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppStore } from '@/store/useAppStore';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { themes } from '@/theme/theme';
import { AuthGuard } from '@/components/AuthGuard';
import { ScreenHeader } from '@/components/headers';
import { Toast } from '@/components/ui/Toast';

function getNavTheme(mode: 'dark' | 'light') {
  const t = themes[mode];
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: mode === 'dark',
    colors: {
      ...base.colors,
      primary: t.tint,
      background: t.background,
      card: t.surface,
      text: t.text,
      border: t.border,
      notification: t.tint,
    },
  };
}

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient());
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-SemiBold': require('../assets/fonts/Montserrat-SemiBold.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'Oswald-Regular': require('../assets/fonts/Oswald-Regular.ttf'),
    'Oswald-Medium': require('../assets/fonts/Oswald-Medium.ttf'),
    'Oswald-SemiBold': require('../assets/fonts/Oswald-SemiBold.ttf'),
    'Oswald-Bold': require('../assets/fonts/Oswald-Bold.ttf'),
  });
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  useEffect(() => {
    hydrate();
    hydrateTheme();
  }, [hydrate, hydrateTheme]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  const isHydrated = useAppStore((s) => s.isHydrated);
  useEffect(() => {
    if (loaded && isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isHydrated]);

  // Forsiraj proveru EAS update-a na svakom pokretanju (samo u build-u, ne u Expo Go)
  useEffect(() => {
    if (__DEV__) return;
    async function checkForUpdates() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // ignorišemo greške (npr. nema mreže)
      }
    }
    checkForUpdates();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function StackHeader({ route }: { route: { name: string } }) {
  const titles: Record<string, string> = {
    admin: 'Admin panel',
    'admin-forbidden': 'Pristup zabranjen',
  };
  const title = titles[route.name] ?? route.name;
  return <ScreenHeader title={title} />;
}

function RootLayoutNav() {
  const themeMode = useThemeStore((s) => s.theme);
  const navTheme = getNavTheme(themeMode);
  const theme = useTheme();

  return (
    <NavThemeProvider value={navTheme}>
      <AuthGuard />
      <Stack
        screenOptions={{
          headerShown: true,
          header: ({ route }) => <StackHeader route={route} />,
          headerStyle: { backgroundColor: theme.background },
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" />
        <Stack.Screen name="admin-forbidden" />
      </Stack>
      <Toast />
    </NavThemeProvider>
  );
}

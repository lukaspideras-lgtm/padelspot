import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/src/lib/supabase';

const ADMIN_ROUTE = 'admin';

export function AuthGuard() {
  const { isHydrated, currentUser } = useAppStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    const segment = segments[0];
    const secondSegment = segments[1];
    const inAuth = segment === 'auth';
    const onVerifyEmail = inAuth && secondSegment === 'verify-email';
    const inAdmin = segment === ADMIN_ROUTE;
    const onIndex = segment === undefined;
    const isLoggedIn = !!currentUser;
    const isAdmin = currentUser?.role === 'admin';

    if (onIndex) return;

    if (onVerifyEmail && !isLoggedIn) return;
    if (onVerifyEmail && isLoggedIn) {
      router.replace('/(tabs)/reserve');
      return;
    }

    if (!isLoggedIn && !inAuth) {
      router.replace('/auth/login');
      return;
    }

    if (isLoggedIn && inAuth && !onVerifyEmail) {
      router.replace('/(tabs)/reserve');
      return;
    }

    // Backup: na auth/callback polling – kad setSession završi, redirect odmah
    const onCallback = segments[1] === 'callback';
    if (inAuth && onCallback && !isLoggedIn) {
      const iv = setInterval(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            clearInterval(iv);
            router.replace('/');
          }
        });
      }, 100);
      return () => clearInterval(iv);
    }

    if (inAdmin && isLoggedIn && !isAdmin) {
      router.replace('/admin-forbidden');
    }
  }, [isHydrated, currentUser, segments]);

  return null;
}

import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

const ADMIN_ROUTE = 'admin';

export function AuthGuard() {
  const { isHydrated, currentUser, pendingVerificationEmail } = useAppStore();
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

    // Pending verification: allow verify-email even when session is null
    if (onVerifyEmail && !isLoggedIn) return;
    if (onVerifyEmail && isLoggedIn) {
      router.replace('/(tabs)/reserve');
      return;
    }

    // If not logged in and not in auth: redirect to login, unless we have pending verify – then go to verify
    if (!isLoggedIn && !inAuth) {
      if (pendingVerificationEmail) {
        router.replace({ pathname: '/auth/verify-email', params: { email: pendingVerificationEmail, fromSignup: 'true' } });
      } else {
        router.replace('/auth/login');
      }
      return;
    }

    if (isLoggedIn && inAuth && !onVerifyEmail) {
      router.replace('/(tabs)/reserve');
      return;
    }

    if (inAdmin && isLoggedIn && !isAdmin) {
      router.replace('/admin-forbidden');
    }
  }, [isHydrated, currentUser, pendingVerificationEmail, segments]);

  return null;
}

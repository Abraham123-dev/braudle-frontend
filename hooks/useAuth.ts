import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { auth, User } from '@/lib/auth';

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isLoading, setIsLoading } = useStore();
  const [initialized, setInitialized] = useState(false);

  // 1. Initial auth check on mount/pathname change (does not re-run when Zustand user changes)
  useEffect(() => {
    let active = true;

    const handleRedirect = (currentUser: User) => {
      if (pathname === '/login') {
        if (!currentUser.onboardingComplete) {
          router.replace('/onboarding');
        } else {
          router.replace('/home');
        }
      }
    };

    async function checkAuth() {
      if (!active) return;
      setIsLoading(true);
      try {
        const response = await api.get<{ user: User }>('/auth/me');
        if (!active) return;
        
        if (response.user) {
          auth.setCurrentUser(response.user);
          setUser(response.user);
          handleRedirect(response.user);
        } else {
          throw new Error('No user data returned');
        }
      } catch (err) {
        if (!active) return;
        auth.clearCurrentUser();
        setUser(null);
        if (requireAuth) {
          router.replace('/login');
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setInitialized(true);
        }
      }
    }

    const stateUser = useStore.getState().user;
    const localUser = auth.getCurrentUser();

    if (!stateUser) {
      if (localUser) {
        // Optimistically set, then verify in background
        setUser(localUser);
        handleRedirect(localUser);
        checkAuth();
      } else {
        if (requireAuth) {
          checkAuth();
        } else {
          // On public pages, verify auth silently in case user is logged in
          api.get<{ user: User }>('/auth/me')
            .then((res) => {
              if (!active) return;
              if (res.user) {
                auth.setCurrentUser(res.user);
                setUser(res.user);
                handleRedirect(res.user);
              }
            })
            .catch(() => {})
            .finally(() => {
              if (active) {
                setInitialized(true);
              }
            });
        }
      }
    } else {
      setInitialized(true);
      handleRedirect(stateUser);
    }

    return () => {
      active = false;
    };
  }, [setUser, setIsLoading, requireAuth, router, pathname]);

  // 2. React to dynamic auth changes (e.g. logging out or session expiry)
  useEffect(() => {
    if (!user && requireAuth && initialized) {
      router.replace('/login');
    }
  }, [user, requireAuth, initialized, router]);

  return { user, isLoading, initialized };
}


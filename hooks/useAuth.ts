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

  useEffect(() => {
    let active = true;

    async function checkAuth() {
      if (!active) return;
      setIsLoading(true);
      try {
        const response = await api.get<{ user: User }>('/auth/me');
        if (!active) return;
        
        if (response.user) {
          auth.setCurrentUser(response.user);
          setUser(response.user);

          // Redirect to home if logged in on login page
          if (pathname === '/login') {
            router.replace('/home');
          }
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

    const localUser = auth.getCurrentUser();
    if (!user) {
      if (localUser) {
        // Optimistically set, then verify in background
        setUser(localUser);
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
                if (pathname === '/login') {
                  router.replace('/home');
                }
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
      if (pathname === '/login') {
        router.replace('/home');
      }
    }

    return () => {
      active = false;
    };
  }, [user, setUser, setIsLoading, requireAuth, router, pathname]);

  return { user, isLoading, initialized };
}

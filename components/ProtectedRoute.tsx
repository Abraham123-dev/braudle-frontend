'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { auth, User } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, setIsLoading } = useStore();
  
  const [mounted, setMounted] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    let active = true;

    async function checkAuth() {
      if (!active) return;
      setChecking(true);
      setIsLoading(true);
      try {
        const response = await api.get<{ user: User }>('/auth/me');
        if (!active) return;
        
        if (response.user) {
          auth.setCurrentUser(response.user);
          setUser(response.user);
          handleNavigation(response.user);
        } else {
          throw new Error('Unauthenticated');
        }
      } catch (err) {
        if (!active) return;
        auth.clearCurrentUser();
        setUser(null);
        router.replace('/login');
      } finally {
        if (active) {
          setChecking(false);
          setIsLoading(false);
        }
      }
    }

    function handleNavigation(currentUser: User) {
      if (currentUser.onboardingComplete) {
        if (pathname === '/onboarding') {
          router.replace('/dashboard');
        } else {
          setChecking(false);
        }
      } else {
        if (pathname === '/onboarding') {
          setChecking(false);
        } else {
          router.replace('/onboarding');
        }
      }
    }

    // Try to get cached user from store or localStorage
    const cachedUser = user || auth.getCurrentUser();

    if (cachedUser) {
      setUser(cachedUser);
      handleNavigation(cachedUser);
      
      // Verify session integrity in the background
      api.get<{ user: User }>('/auth/me')
        .then((response) => {
          if (!active) return;
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);
            handleNavigation(response.user);
          } else {
            throw new Error('Session invalid');
          }
        })
        .catch(() => {
          if (!active) return;
          auth.clearCurrentUser();
          setUser(null);
          router.replace('/login');
        });
    } else {
      checkAuth();
    }

    return () => {
      active = false;
    };
  }, [mounted, user, pathname, router, setUser, setIsLoading]);

  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-brand-charcoal flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-lime" />
      </div>
    );
  }

  return <>{children}</>;
}

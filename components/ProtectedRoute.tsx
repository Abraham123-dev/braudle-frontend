'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { auth, User } from '@/lib/auth';
// No Loader2 needed

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

  // 1. Initial auth check on mount/pathname change (does not re-run when Zustand user changes)
  useEffect(() => {
    if (!mounted) return;

    let active = true;

    const handleRedirect = (currentUser: User) => {
      if (!currentUser.onboardingComplete) {
        if (pathname !== '/onboarding') {
          router.replace('/onboarding');
          return true;
        }
      } else {
        if (pathname === '/onboarding') {
          router.replace('/home');
          return true;
        }
      }
      return false;
    };

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
          
          const redirected = handleRedirect(response.user);
          if (!redirected) {
            setChecking(false);
          }
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
          setIsLoading(false);
        }
      }
    }

    // Try to get cached user from store or localStorage
    const stateUser = useStore.getState().user;
    const cachedUser = stateUser || auth.getCurrentUser();

    if (cachedUser) {
      setUser(cachedUser);
      const redirected = handleRedirect(cachedUser);
      if (!redirected) {
        setChecking(false);
      }
      
      // Verify session integrity in the background
      api.get<{ user: User }>('/auth/me')
        .then((response) => {
          if (!active) return;
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);
            handleRedirect(response.user);
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
  }, [mounted, router, pathname, setUser, setIsLoading]);

  // 2. React to dynamic auth changes (e.g. logging out or session expiry)
  useEffect(() => {
    if (mounted && !user && !checking) {
      router.replace('/login');
    }
  }, [mounted, user, checking, router]);

  if (!mounted || checking) {
    return (
      <div className="min-h-screen bg-white font-sans flex flex-col animate-pulse select-none">
        {/* Navbar skeleton */}
        <header className="border-b border-gray-100 py-5 px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="h-6 w-24 bg-gray-100 rounded-full" />
            <div className="flex gap-4">
              <div className="h-8 w-24 bg-gray-100 rounded-full" />
              <div className="h-8 w-8 bg-gray-100 rounded-full" />
            </div>
          </div>
        </header>
        {/* Content skeleton */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-8 py-12 space-y-8">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-gray-100 rounded-full" />
            <div className="h-4 w-40 bg-gray-100 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="border border-gray-100 rounded-3xl p-6 min-h-[220px] flex flex-col justify-between">
                <div>
                  <div className="flex justify-between mb-4">
                    <div className="h-4 w-16 bg-gray-100 rounded-full" />
                    <div className="h-3 w-12 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-100 rounded-full mb-3" />
                  <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
                </div>
                <div className="h-8 bg-gray-100 rounded-xl" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}


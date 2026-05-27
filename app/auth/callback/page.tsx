'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    // Check for a token parameter in query search params (e.g. ?token=jwt_value_here)
    const token = searchParams.get('token');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const avatar = searchParams.get('avatar') || undefined;

    if (token && userId && name && email) {
      // Save details to helper and store
      auth.setToken(token);
      
      const loggedUser = {
        id: userId,
        name,
        email,
        avatar,
        role: 'student' as const,
      };
      
      auth.setCurrentUser(loggedUser);
      setUser(loggedUser);

      // Redirect to student dashboard
      router.replace('/dashboard');
    } else {
      // If no token exists, fallback check if we have a cookie, or redirect to login
      const localUser = auth.getCurrentUser();
      const localToken = auth.getToken();
      
      if (localUser && localToken) {
        setUser(localUser);
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [searchParams, router, setUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Authenticating study profile...
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Please wait while we establish your private tutor session.
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 dark:text-indigo-400" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

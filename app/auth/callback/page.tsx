'use client';

import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((state) => state.setUser);
  const [error, setError] = useState('');

  useEffect(() => {
    async function verifyAuth() {
      // Magic Link verification
      const token = searchParams.get('token');
      
      if (token) {
        try {
          // Call the backend to verify the magic link token
          const res = await api.post<{ user: any; message: string }>('/auth/email/verify', { token });
          
          if (res.user) {
            auth.setCurrentUser(res.user);
            setUser(res.user);
            router.replace('/dashboard');
            return;
          }
        } catch (err: any) {
          setError(err.message || 'Invalid or expired login link.');
          setTimeout(() => {
            router.replace('/login');
          }, 3000);
          return;
        }
      }

      // If no token in URL, maybe we were redirected here from Google Auth?
      // Check if we can fetch the user profile using the httpOnly cookie
      try {
        const res = await api.get<{ user: any }>('/auth/me');
        if (res.user) {
          auth.setCurrentUser(res.user);
          setUser(res.user);
          router.replace('/dashboard');
          return;
        }
      } catch (err) {
        // Not authenticated
        router.replace('/login');
      }
    }

    verifyAuth();
  }, [searchParams, router, setUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
      <div className="text-center flex flex-col items-center gap-4">
        {error ? (
          <div className="text-red-400 font-medium">
            <p>{error}</p>
            <p className="text-xs opacity-70 mt-2">Redirecting to login...</p>
          </div>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-brand-green" />
            <h2 className="text-lg font-semibold text-white">
              Authenticating study profile...
            </h2>
            <p className="text-xs text-white/50">
              Please wait while we establish your session.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#1A1A1A]">
          <Loader2 className="w-10 h-10 animate-spin text-brand-green" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

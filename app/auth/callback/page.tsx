'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, User } from '@/lib/auth';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useStore((state) => state.setUser);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // If token is found, verify it with backend
      async function verifyMagicLink() {
        try {
          const response = await api.post<{ user: User; message: string }>('/auth/email/verify', { token });
          
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);

            // Redirect directly to dashboard
            router.replace('/dashboard');
          } else {
            throw new Error('Failed to retrieve user details.');
          }
        } catch (err: any) {
          setErrorMsg(err.message || 'The magic login link is invalid, expired, or has already been used.');
          setVerifying(false);
        }
      }
      verifyMagicLink();
    } else {
      // If no token exists in query parameters, check local storage session cache
      const localUser = auth.getCurrentUser();
      if (localUser) {
        setUser(localUser);
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [searchParams, router, setUser]);

  if (errorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-brand-charcoal p-6 text-center">
        <div className="max-w-md w-full bg-brand-forest/20 border border-white/5 rounded-3xl p-8 space-y-6">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Authentication Failed</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              {errorMsg}
            </p>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 rounded-full bg-brand-green py-3.5 px-6 text-sm font-semibold text-white hover:bg-brand-green/80 transition-all cursor-pointer w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-charcoal">
      <div className="text-center flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand-lime" />
        <h2 className="text-lg font-semibold text-white">
          {verifying ? 'Verifying magic link...' : 'Redirecting to your dashboard...'}
        </h2>
        <p className="text-xs text-gray-400">
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-brand-charcoal">
          <Loader2 className="w-10 h-10 animate-spin text-brand-lime" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}


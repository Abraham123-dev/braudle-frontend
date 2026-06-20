'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, User } from '@/lib/auth';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { AlertCircle, ArrowLeft } from 'lucide-react';

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

            // Redirect correctly based on onboarding status
            if (!response.user.onboardingComplete) {
              router.replace('/onboarding');
            } else {
              router.replace('/home');
            }
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
      // If no token exists in query parameters (e.g. Google OAuth callback), verify session with backend
      async function verifySession() {
        try {
          const response = await api.get<{ user: User }>('/auth/me');
          
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);

            if (!response.user.onboardingComplete) {
              router.replace('/onboarding');
            } else {
              router.replace('/home');
            }
          } else {
            throw new Error('No user data found');
          }
        } catch (err) {
          // Fallback to local storage cached user if backend call fails
          const localUser = auth.getCurrentUser();
          if (localUser) {
            setUser(localUser);
            if (!localUser.onboardingComplete) {
              router.replace('/onboarding');
            } else {
              router.replace('/home');
            }
          } else {
            router.replace('/login');
          }
        }
      }
      verifySession();
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-charcoal px-6">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 bg-brand-forest/20 border border-white/5 rounded-3xl shadow-2xl">
        <div className="w-12 h-12 rounded-xl bg-brand-lime/10 flex items-center justify-center border border-brand-lime/20 animate-pulse">
          <div className="w-4 h-4 rounded-full bg-brand-lime" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-white">
            Welcome to Braudle
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed animate-pulse">
            {verifying 
              ? 'Verifying your secure sign-in link...' 
              : 'Directing you to your learning space...'}
          </p>
        </div>
        <p className="text-xs text-white/30 font-medium">
          Preparing your workspace
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-brand-charcoal animate-pulse">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 bg-brand-forest/20 border border-white/5 rounded-3xl">
            <div className="w-12 h-12 rounded-xl bg-brand-lime/10 flex items-center justify-center border border-brand-lime/20">
              <div className="w-4 h-4 rounded-full bg-brand-lime" />
            </div>
            <div className="h-6 w-32 bg-white/10 rounded-full" />
            <div className="h-4 w-48 bg-white/5 rounded-full" />
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}



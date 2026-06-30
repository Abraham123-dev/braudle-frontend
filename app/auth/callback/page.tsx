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
      // Magic link token verification
      async function verifyMagicLink() {
        try {
          const response = await api.post<{ user: User; message: string }>('/auth/email/verify', { token });
          
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('braudle_last_login_method', 'email');
            }

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
      // Social OAuth verification
      async function verifySession() {
        try {
          const response = await api.get<{ user: User }>('/auth/me');
          
          if (response.user) {
            auth.setCurrentUser(response.user);
            setUser(response.user);
            if (typeof window !== 'undefined') {
              localStorage.setItem('braudle_last_login_method', 'google');
            }

            if (!response.user.onboardingComplete) {
              router.replace('/onboarding');
            } else {
              router.replace('/home');
            }
          } else {
            throw new Error('No user data found');
          }
        } catch (err) {
          // Fallback to local storage
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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FBFC] p-6 text-center text-brand-forest font-sans">
        <div className="max-w-md w-full bg-white border border-zinc-100 rounded-3xl p-8 space-y-6 shadow-xs select-none">
          
          {/* Brand Logo Header */}
          <div className="flex justify-center items-center gap-2 border-b border-zinc-100 pb-4">
            <span className="font-semibold text-xl tracking-tight text-brand-green">
              Braudle
            </span>
          </div>

          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-3xs">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold tracking-tight text-brand-forest">
              Authentication Failed
            </h2>
            <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
              {errorMsg}
            </p>
          </div>

          <button
            onClick={() => router.push('/login')}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-green py-3 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer w-full active:scale-[0.98] shadow-3xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FBFC] px-6 text-brand-forest font-sans">
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 bg-white border border-zinc-100 rounded-3xl shadow-xs select-none">
        
        {/* Animated Brand Logo element */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-2xl tracking-tight text-brand-green">
            Braudle
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
          </span>
        </div>

        {/* Dynamic verify state */}
        <div className="space-y-3">
          <h2 className="text-xl font-extrabold tracking-tight text-brand-forest">
            Secure Authentication
          </h2>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider leading-relaxed">
            {verifying 
              ? 'Verifying your unique sign-in link...' 
              : 'Directing you to your learning space...'}
          </p>
        </div>

        {/* Custom modern circular loading animation */}
        <div className="relative w-10 h-10 flex items-center justify-center mt-2">
          <div className="absolute inset-0 rounded-full border-3 border-zinc-100 border-t-brand-green animate-spin" />
        </div>

        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-4">
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FBFC] animate-pulse">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 bg-white border border-zinc-100 rounded-3xl">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-zinc-100 rounded-full" />
            </div>
            <div className="h-5 w-44 bg-zinc-100 rounded-full" />
            <div className="h-8 w-8 rounded-full border-3 border-zinc-100 border-t-zinc-200 animate-spin mt-2" />
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

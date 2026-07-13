'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth, User } from '@/lib/auth';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

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
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-[#f4f7f4] via-white to-[#f0f5fd] p-6 text-center text-brand-forest font-sans relative overflow-hidden">
        {/* Glow meshes */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#F2F6E8]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full backdrop-blur-md bg-white/75 border border-zinc-200/40 rounded-[32px] p-8 space-y-6 shadow-xl select-none relative overflow-hidden flex flex-col items-center">
          {/* Brand Logo Header */}
          <div className="flex justify-center items-center gap-2 border-b border-zinc-100/60 pb-4 w-full">
            <Logo size={24} className="object-contain" />
            <span className="font-extrabold text-lg tracking-tight text-brand-forest">
              Braudle
            </span>
          </div>

          <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center shadow-3xs">
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-[#f4f7f4] via-white to-[#f0f5fd] px-6 text-brand-forest font-sans relative overflow-hidden">
      {/* Glow meshes */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#F2F6E8]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 backdrop-blur-md bg-white/75 border border-zinc-200/40 rounded-[32px] shadow-xl select-none relative overflow-hidden">
        
        {/* Animated Brand Logo element */}
        <div className="flex items-center gap-2 mb-2 bg-[#F6FAF2] border border-brand-green/15 rounded-2xl px-4 py-2">
          <Logo size={24} className="object-contain" />
          <span className="font-extrabold text-lg tracking-tight text-brand-forest font-sans">
            Braudle
          </span>
          <span className="relative flex h-2 w-2 ml-1">
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
        <div className="relative w-24 h-24 flex items-center justify-center my-3">
          <div className="absolute inset-0 rounded-full border-4 border-zinc-100/80 border-t-brand-green animate-spin" />
          <div className="absolute inset-2 rounded-full bg-brand-green/5 border border-brand-green/10 animate-pulse" />
          <Logo size={46} className="animate-pulse object-contain z-10" />
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
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-tr from-[#f4f7f4] via-white to-[#f0f5fd] animate-pulse relative overflow-hidden">
          <div className="max-w-md w-full text-center flex flex-col items-center gap-6 p-8 backdrop-blur-md bg-white/75 border border-zinc-200/40 rounded-[32px] shadow-xl">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-zinc-100 rounded-full" />
            </div>
            <div className="h-5 w-44 bg-zinc-100 rounded-full" />
            <div className="relative w-16 h-16 flex items-center justify-center mt-2">
              <div className="absolute inset-0 rounded-full border-3 border-zinc-100 border-t-brand-green animate-spin" />
              <Logo size={32} className="animate-pulse object-contain" />
            </div>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}

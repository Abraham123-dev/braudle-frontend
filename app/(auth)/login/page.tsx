'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Loader2, Mail } from 'lucide-react';

export default function LoginPage() {
  // Silent auth check - redirects to dashboard if already logged in
  const { isLoading: authChecking } = useAuth(false);

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleConflict, setGoogleConflict] = useState(false);

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const authUrl = backendUrl.endsWith('/api') 
      ? `${backendUrl}/auth/google` 
      : `${backendUrl}/api/auth/google`;
    window.location.href = authUrl;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setGoogleConflict(false);

    try {
      await api.post('/auth/email/start', { email });
      setEmailSent(true);
    } catch (err: any) {
      if (err.code === 'GOOGLE_ACCOUNT_EXISTS') {
        setGoogleConflict(true);
      } else {
        setError(err.message || 'Failed to send magic link. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-brand-charcoal flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-lime" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-charcoal font-sans antialiased flex flex-col items-center lg:justify-center justify-start p-8 pt-24 lg:pt-8">
      <main className="max-w-5xl w-full flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
        {/* Left Side: Auth Section */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          <div className="space-y-3">
             {/* Simple Logo Icon */}
             <div className="w-10 h-10 bg-brand-forest rounded-lg flex items-center justify-center mb-8 hidden lg:flex">
                 <div className="w-5 h-5 bg-brand-lime rounded-sm rotate-45" />
             </div>
             
             <h1 className="text-4xl lg:text-5xl font-semibold text-white leading-[1.2] tracking-tight">
                Welcome to <span className="text-brand-green">Braudle</span>
             </h1>
             <p className="text-lg lg:text-xl text-gray-400 font-medium tracking-tight">
               Your AI tutor for deep learning
             </p>
          </div>

          <div className="w-full max-w-sm space-y-5">
            {/* 1. Google Login Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="group flex w-full items-center justify-center gap-4 rounded-full border border-white/10 bg-white/5 py-4 px-6 text-[15px] font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] shadow-2xl cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>
              <div className="flex items-center justify-center gap-2 py-0.5 opacity-40">
                <svg className="w-3 h-3 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-medium">Secure OAuth 2.0</span>
              </div>
            </div>

            {/* OR Separator */}
            <div className="flex items-center gap-4">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[11px] uppercase tracking-widest text-white/30 font-medium">or</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            {/* 2. Continue with Email Button */}
            {!showEmailForm && !emailSent && (
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 py-4 px-6 text-[15px] font-medium text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Mail className="w-5 h-5 shrink-0 text-white/70 group-hover:text-white transition-colors" />
                Continue with Email
              </button>
            )}

            {/* 3. Email Input Box (revealed after clicking Continue with Email) */}
            {emailSent ? (
              <div className="bg-brand-forest border border-brand-green/30 rounded-2xl p-5 text-left space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" /> Link Sent!
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Check your inbox at <strong className="text-white">{email}</strong> for your magic link to log in.
                </p>
                <button
                  type="button"
                  onClick={() => { setEmailSent(false); setShowEmailForm(true); }}
                  className="text-[11px] font-bold text-brand-green hover:underline cursor-pointer"
                >
                  Use a different email
                </button>
              </div>
            ) : showEmailForm ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                  <label className="text-[11px] text-white/50 uppercase tracking-wider font-medium block text-left">
                    Enter your email
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3 px-4 text-[14px] text-white placeholder-white/30 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                  />

                  {error && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl text-left">
                      {error}
                    </div>
                  )}

                  {googleConflict && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl text-left space-y-1">
                      <strong className="text-white font-semibold">Google Sign-In Required</strong>
                      <p className="text-gray-300 leading-relaxed">
                        This email is linked to a Google account. Please use &quot;Continue with Google&quot; above.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-green py-3 px-6 text-[14px] font-semibold text-white hover:bg-brand-green/80 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending link...
                      </>
                    ) : (
                      'Send Magic Link'
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => { setShowEmailForm(false); setError(''); setGoogleConflict(false); }}
                  className="text-[11px] text-white/40 hover:text-white/60 transition-colors cursor-pointer block mx-auto"
                >
                  ← Back to login options
                </button>
              </form>
            ) : null}

            <p className="text-[12px] text-gray-400 leading-relaxed font-normal text-center lg:text-left">
              By signing up, you agree to the <Link href="/terms" className="underline hover:text-brand-green">Terms of Use</Link>, <Link href="/privacy" className="underline hover:text-brand-green">Privacy Policy</Link>, and Cookie Notice.
            </p>
          </div>
        </div>

        {/* Right Side: Consistent Brand Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="relative w-full aspect-[4/5] max-w-sm rounded-[32px] overflow-hidden bg-brand-forest p-10 flex flex-col justify-end shadow-2xl">
            <div className="absolute inset-0 z-0 group">
              <img 
                src="https://images.unsplash.com/photo-1519337265831-281ec6cc8514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Student using phone to study"
                className="w-full h-full object-cover grayscale opacity-40"
              />
              <div className="absolute inset-0 bg-brand-green/30 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-brand-charcoal/40 to-transparent" />
            </div>
            
            <div className="relative z-20 space-y-6">
              <div className="flex gap-1.5">
                <div className="h-1.5 w-8 bg-brand-lime rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold text-white leading-[1.1] tracking-tight">
                  Master concepts <br /> for free.
                </h2>
                <p className="text-white/50 text-sm font-normal">
                  No subscriptions. No friction. Just deep understanding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

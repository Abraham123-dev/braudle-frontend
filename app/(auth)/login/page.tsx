'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post<{ message: string }>('/auth/email/start', { email });
      setSuccess(res.message || 'Check your email for the magic link!');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] font-sans antialiased flex flex-col items-center lg:justify-center justify-start p-8 pt-24 lg:pt-8 text-white">
     <main className="max-w-5xl w-full flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">
        {/* Left Side: Auth Section */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-8">
          <div className="space-y-3">
             {/* Simple Logo Icon */}
             <div className="w-10 h-10 bg-[#4A783A] rounded-lg flex items-center justify-center mb-8 hidden lg:flex shadow-sm">
                <div className="w-5 h-5 bg-[#C2E1A6] rounded-sm rotate-45" />
             </div>
             
             <h1 className="text-4xl lg:text-5xl font-serif font-medium leading-[1.2] tracking-tight">
               Welcome to Braudle
             </h1>
             <p className="text-lg lg:text-xl text-gray-400">
               Your AI tutor for deep learning
             </p>
          </div>

          <div className="w-full max-w-sm space-y-6">
            
            {/* Email Section */}
            {!isEmailOpen ? (
              <button
                type="button"
                onClick={() => setIsEmailOpen(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A783A] py-4 px-6 text-[15px] font-semibold text-white hover:bg-[#3D6330] transition-colors shadow-sm"
              >
                Continue with email
              </button>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2">
                {success ? (
                  <div className="p-4 rounded-xl bg-[#4A783A]/20 border border-[#C2E1A6]/20 text-[#C2E1A6] text-sm flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{success}</p>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="email"
                        id="email-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder=" "
                        required
                        className="peer w-full rounded-xl border border-white/10 bg-transparent px-5 pt-6 pb-2 text-[15px] text-white focus:border-[#4A783A] focus:outline-none transition-colors shadow-sm"
                      />
                      <label 
                        htmlFor="email-input"
                        className="absolute left-5 top-4 text-gray-500 text-[15px] transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-[15px] peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:text-[#C2E1A6] peer-valid:top-1.5 peer-valid:text-[11px] peer-valid:font-semibold peer-valid:text-[#C2E1A6] pointer-events-none"
                      >
                        Email address
                      </label>
                    </div>
                    {error && (
                      <p className="text-red-400 text-sm font-medium">{error}</p>
                    )}
                    <button
                      type="submit"
                      disabled={loading || !email}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A783A] py-4 px-6 text-[15px] font-semibold text-white hover:bg-[#3D6330] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Login Link'}
                    </button>
                  </>
                )}
              </form>
            )}

            <div className="flex items-center gap-3 justify-center py-2">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">OR</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex w-full items-center justify-center gap-4 rounded-xl border border-white/10 bg-white/5 py-4 px-6 text-[15px] font-medium text-white hover:bg-white/10 transition-colors shadow-sm"
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

            <p className="text-[12px] text-gray-500 leading-relaxed font-normal text-center lg:text-left mt-6">
              By continuing, you agree to the <Link href="/terms" className="underline hover:text-white transition-colors">Terms of Use</Link>, <Link href="/privacy" className="underline hover:text-white transition-colors">Privacy Policy</Link>, and Cookie Notice.
            </p>
          </div>
        </div>

        {/* Right Side: Consistent Brand Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="relative w-full aspect-[4/5] max-w-sm rounded-[32px] overflow-hidden bg-[#2D3F2D] p-10 flex flex-col justify-end">
            <div className="absolute inset-0 z-0 group">
              <img 
                src="https://images.unsplash.com/photo-1519337265831-281ec6cc8514?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Student using phone to study"
                className="w-full h-full object-cover mix-blend-overlay opacity-50 grayscale"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-[#1A1A1A]/50 to-transparent opacity-90" />
            </div>
            
            <div className="relative z-20 space-y-6">
              <div className="flex gap-1.5">
                <div className="h-1.5 w-8 bg-[#C2E1A6] rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
                <div className="h-1.5 w-2 bg-white/20 rounded-full" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-serif font-medium text-white leading-[1.1] tracking-tight">
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

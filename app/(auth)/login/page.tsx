'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] font-sans antialiased flex flex-col items-center lg:justify-center justify-start p-8 pt-24 lg:pt-8">
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

          <div className="w-full max-w-sm space-y-6">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="group flex w-full items-center justify-center gap-4 rounded-full border border-white/10 bg-white/5 py-3.5 px-6 text-[15px] font-medium text-white hover:bg-white/10 transition-colors active:scale-95 shadow-sm"
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

            <p className="text-[12px] text-gray-400 leading-relaxed font-normal">
              By signing up, you agree to the <Link href="/terms" className="underline hover:text-brand-green">Terms of Use</Link>, <Link href="/privacy" className="underline hover:text-brand-green">Privacy Policy</Link>, and Cookie Notice.
            </p>
          </div>
        </div>

        {/* Right Side: Consistent Brand Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end">
          <div className="relative w-full aspect-[4/5] max-w-sm rounded-[32px] overflow-hidden bg-brand-forest p-8 flex flex-col justify-end shadow-lg">
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                alt="Students studying"
                className="w-full h-full object-cover opacity-60"
              />
              {/* Subtle green overlay to match brand vibe */}
              <div className="absolute inset-0 bg-brand-forest/20" />
              <div className="absolute inset-0 bg-linear-to-t from-brand-forest via-brand-forest/20 to-transparent" />
            </div>
            
            <div className="relative z-20 space-y-4">
              <div className="w-10 h-1.5 bg-brand-lime rounded-full" />
              <h2 className="text-3xl font-semibold text-white leading-tight tracking-tight">
                Empowering your <br /> academic journey
              </h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

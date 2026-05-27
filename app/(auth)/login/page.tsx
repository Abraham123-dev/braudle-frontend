'use client';

import React from 'react';
import Image from 'next/image';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // Redirects browser directly to Express Google OAuth backend route
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/google`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-md bg-white border border-zinc-100 rounded-3xl p-8 shadow-xl dark:bg-zinc-900 dark:border-zinc-800 text-center">
        {/* Brand Logo Placeholder */}
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 mb-6 dark:bg-indigo-950/40">
          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">B</span>
        </div>

        <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2 dark:text-zinc-50">
          BRAUDLE
        </h1>
        <p className="text-sm text-zinc-500 mb-8 dark:text-zinc-400">
          Your 24/7 AI-Powered Personal Study Companion & Tutor.
        </p>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white py-3.5 px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-all shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {/* Simple custom Google icon path */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3 0-3.478 2.822-6.3 6.3-6.3 1.63 0 3.11.63 4.23 1.654l3.07-3.07C19.167 2.683 15.93 1.5 12.24 1.5A10.5 10.5 0 001.74 12a10.5 10.5 0 0010.5 10.5c5.786 0 10.157-4.066 10.157-10.3 0-.69-.08-1.36-.227-1.915H12.24z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="mt-8 border-t border-zinc-100 pt-6 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            By signing in, you agree to our Terms of Service and Privacy Policy. Max 2 uploads per day applies on the free tier.
          </p>
        </div>
      </div>
    </div>
  );
}

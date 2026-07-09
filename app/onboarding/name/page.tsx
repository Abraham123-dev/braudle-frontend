'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import { Loader2, ChevronRight } from 'lucide-react';

export default function NameOnboardingPage() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      setError('Please enter a valid name (at least 2 characters).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.patch<{ status: string; user: any; message: string }>('/auth/onboarding/name', {
        name: name.trim(),
      });

      if (res.user) {
        auth.setCurrentUser(res.user);
        setUser(res.user);
        // Continue to the main onboarding setup
        router.replace('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update name. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F2] flex flex-col items-center justify-center p-6 text-[#1B3B2B] font-sans">
      <div className="max-w-md w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white p-8 rounded-[32px] border border-[#E5E7DF] shadow-sm">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 bg-[#4A783A] rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <div className="w-6 h-6 bg-[#C2E1A6] rounded-md rotate-45" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-brand-forest">
            What should we call you?
          </h1>
          <p className="text-[#6B7280] text-[15px]">
            We need your name to personalize your tutoring experience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your first name"
              required
              minLength={2}
              maxLength={50}
              className="w-full rounded-xl border border-[#E5E7DF] bg-[#F6F7F2] px-6 py-4 text-[#1B3B2B] placeholder:text-[#9CA3AF] focus:border-[#4A783A] focus:outline-none focus:ring-1 focus:ring-[#4A783A] transition-colors text-lg text-center"
            />
          </div>

          {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading || name.trim().length < 2}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#4A783A] py-4 px-6 text-[16px] font-medium text-white hover:bg-[#3D6330] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Continue <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

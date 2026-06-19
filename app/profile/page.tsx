'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 py-4 px-6 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-gray-400 hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="font-bold text-white">My Profile</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-brand-green flex items-center justify-center text-white font-black text-3xl shadow-md">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
          <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
            Mock profile statistics cleared. Ready to implement the redesigned profile details with the real API endpoints.
          </p>
        </main>
      </div>
    </ProtectedRoute>
  );
}

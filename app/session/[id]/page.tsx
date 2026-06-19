'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ActiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col">
        {/* Session Header */}
        <header className="border-b border-white/5 p-4 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-gray-400 hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-white">Active Tutoring Session</h3>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                Document ID: {docId}
              </span>
            </div>
          </div>
        </header>

        {/* Content Placeholder */}
        <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 bg-brand-green/20 border border-brand-green/30 rounded-3xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-lime" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Preparing Tutoring Environment</h2>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mx-auto">
              Mock study session data cleared. The tutoring chat area is ready to be redesigned with active SSE streaming and custom Socratic interactions.
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


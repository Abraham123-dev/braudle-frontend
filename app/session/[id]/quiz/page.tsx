'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function QuizSessionPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col">
        {/* Header */}
        <header className="border-b border-white/5 py-4 px-6 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl text-gray-400 hover:bg-white/5"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-white">Adaptive Quiz</span>
            </div>
          </div>
        </header>

        {/* Content Placeholder */}
        <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 bg-brand-green/20 border border-brand-green/30 rounded-3xl flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-lime" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Loading Quiz Questions</h2>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed mx-auto">
              Mock quiz questions and evaluations cleared. The assessment view is ready to be redesigned with the real Groq-based adaptive grading pipeline.
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


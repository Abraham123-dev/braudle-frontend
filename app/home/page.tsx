'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { auth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { LogOut, BookOpen, Compass, Trophy } from 'lucide-react';

export default function HomeLearningPage() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-brand-forest font-sans flex flex-col">
        {/* Top Header */}
        <header className="border-b border-gray-100 py-4 px-6 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-black text-sm">
                B
              </div>
              <span className="font-bold text-brand-forest tracking-wider uppercase text-sm">Braudle</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                Hi, <strong className="text-brand-forest font-semibold">{user?.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-gray-50 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Workspace Canvas Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col">
          {/* Welcome Dashboard Banner */}
          <div className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight text-brand-forest">Home Learning</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back! This is your personalized home learning space.
            </p>
          </div>

          {/* Grid Canvas for Future Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
            <div className="border border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-gray-50/50">
              <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-brand-forest text-base mb-1">Your Library</h3>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                Start uploading your notes and textbooks here.
              </p>
            </div>

            <div className="border border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-gray-50/50">
              <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-brand-forest text-base mb-1">Learning Space</h3>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                Personalized AI tutoring session will launch from here.
              </p>
            </div>

            <div className="border border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[300px] bg-gray-50/50">
              <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-brand-forest text-base mb-1">Weekly Challenge</h3>
              <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                Adaptive quizzes and streak metrics will appear here.
              </p>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


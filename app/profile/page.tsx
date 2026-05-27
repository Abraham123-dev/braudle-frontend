'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import { ArrowLeft, Loader2, Award, Zap, AlertTriangle, CheckSquare, BarChart2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);

  // Mock full learning profile stats
  const [stats, setStats] = useState({
    level: 'beginner',
    totalSessions: 14,
    averageScore: 82,
    weakTopics: ['Mitosis cell phases', 'Photosynthesis dark cycle', 'Desmos Graphing basics'],
    strongTopics: ['Mitochondria function', 'Ribosome structure', 'Plant cell structures'],
    weeklyXp: [120, 240, 90, 310, 150, 0, 420],
  });

  useEffect(() => {
    const loggedUser = auth.getCurrentUser();
    if (!loggedUser) {
      router.replace('/login');
      return;
    }
    setUser(loggedUser);
    
    const timer = setTimeout(() => {
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [router, setUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-zinc-100 z-10 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-zinc-900 dark:text-zinc-50">My Learning Profile</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* User Card */}
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-black text-3xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'S'}
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {user?.name || 'Student'}
            </h2>
            <p className="text-xs text-zinc-400 mb-4 dark:text-zinc-500">
              {user?.email || 'student@domain.edu'}
            </p>
            <div className="flex gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 uppercase tracking-wider dark:bg-indigo-950/40 dark:text-indigo-400">
                Level: {stats.level}
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 uppercase tracking-wider dark:bg-emerald-950/40 dark:text-emerald-400">
                XP: 1,840
              </span>
            </div>
          </div>
        </div>

        {/* Stats metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Average Accuracy Card */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 flex items-center gap-5">
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl dark:bg-indigo-950/50 dark:text-indigo-400">
              <BarChart2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                {stats.averageScore}%
              </h4>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Average Quiz Accuracy
              </p>
            </div>
          </div>

          {/* Completed Sessions Card */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800 flex items-center gap-5">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl dark:bg-emerald-950/50 dark:text-emerald-400">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-3xl font-black text-zinc-900 dark:text-zinc-50">
                {stats.totalSessions}
              </h4>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Study Sessions Logged
              </p>
            </div>
          </div>

        </div>

        {/* Adaptive Analytics Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          
          {/* Strong Topics */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
              <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Strong Topics
            </h4>
            <div className="space-y-3">
              {stats.strongTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 text-xs font-medium text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-950/50 dark:text-emerald-400"
                >
                  <CheckSquare className="w-4 h-4 shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics */}
          <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <h4 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2 dark:text-zinc-50">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Focus Topics (Weaknesses)
            </h4>
            <div className="space-y-3">
              {stats.weakTopics.map((topic, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 bg-amber-50/50 border border-amber-100 rounded-2xl p-3 text-xs font-medium text-amber-900 dark:bg-amber-950/20 dark:border-amber-950/50 dark:text-amber-400"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{topic}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Dynamic prompt explanation */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5 dark:bg-indigo-950/20 dark:border-indigo-900/30 text-xs text-indigo-950 leading-relaxed dark:text-indigo-400">
          💡 **Adaptive Engine Insight:** Weak topics listed above are automatically injected into system prompts for subsequent teach sessions, ensuring BRAUDLE allocates more time and applies simpler analogies to reinforce those specific learning gaps.
        </div>

      </main>
    </div>
  );
}

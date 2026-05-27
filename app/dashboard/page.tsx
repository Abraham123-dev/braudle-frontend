'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import DocumentCard, { Document } from '@/components/dashboard/DocumentCard';
import SessionHistory, { HistoryItem } from '@/components/dashboard/SessionHistory';
import { Upload, BookOpen, Clock, BarChart3, LogOut, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Validate authentication
    const loggedUser = auth.getCurrentUser();
    if (!loggedUser) {
      router.replace('/login');
      return;
    }
    setUser(loggedUser);

    // Simulate API fetch for documents & sessions history
    const timer = setTimeout(() => {
      setDocuments([
        {
          id: 'doc-1',
          title: 'Cell_Biology_Lecture_1.pdf',
          type: 'pdf',
          processingStatus: 'ready',
          totalChunks: 12,
          subject: 'Biology',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        },
        {
          id: 'doc-2',
          title: 'Linear_Algebra_Notes.pdf',
          type: 'pdf',
          processingStatus: 'processing',
          totalChunks: 0,
          subject: 'Mathematics',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        },
      ]);

      setSessions([
        {
          id: 'session-1',
          documentId: 'doc-1',
          documentTitle: 'Cell_Biology_Lecture_1.pdf',
          topic: 'Mitochondria & Cellular Respiration',
          score: 85,
          mode: 'quiz',
          date: new Date(Date.now() - 3600000 * 3).toISOString(),
        },
        {
          id: 'session-2',
          documentId: 'doc-1',
          documentTitle: 'Cell_Biology_Lecture_1.pdf',
          topic: 'Cell Membrane structure',
          mode: 'teach',
          date: new Date(Date.now() - 3600000 * 20).toISOString(),
        },
      ]);
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [router, setUser]);

  const handleStartSession = (docId: string, mode: 'teach' | 'quiz') => {
    if (mode === 'teach') {
      router.push(`/session/${docId}`);
    } else {
      router.push(`/session/${docId}/quiz`);
    }
  };

  const handleViewSession = (sessionId: string) => {
    // Details viewer, for MVP we can redirect to that session
    router.push(`/session/doc-1`);
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-black">
      {/* Navbar */}
      <header className="sticky top-0 bg-white border-b border-zinc-100 z-10 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm dark:bg-indigo-700">
              B
            </span>
            <span className="font-black text-zinc-900 dark:text-zinc-50">BRAUDLE</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="text-xs font-semibold text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
            >
              Hi, {user?.name || 'Student'}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Stats Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-zinc-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl dark:bg-indigo-950/40 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Materials</div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{documents.length} Uploaded</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl dark:bg-emerald-950/40 dark:text-emerald-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Study Duration</div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">1.2 hours</div>
            </div>
          </div>

          <div className="bg-white border border-zinc-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl dark:bg-amber-950/40 dark:text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Avg score</div>
              <div className="text-xl font-bold text-zinc-900 dark:text-zinc-50">85% Correct</div>
            </div>
          </div>
        </div>

        {/* Dashboard Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Study Materials</h3>
          <button
            onClick={() => router.push('/dashboard/upload')}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-800"
          >
            <Upload className="w-4 h-4" /> Upload PDF
          </button>
        </div>

        {/* Document Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onStartSession={handleStartSession} />
          ))}
        </div>

        {/* Recent Session History */}
        <h3 className="text-lg font-bold text-zinc-900 mb-4 dark:text-zinc-100">Learning Progress Log</h3>
        <SessionHistory history={sessions} onViewSession={handleViewSession} />
      </main>
    </div>
  );
}

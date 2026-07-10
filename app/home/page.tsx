'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { auth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import DocumentCard, { Document } from '@/components/dashboard/DocumentCard';
import UploadModal from '@/components/dashboard/UploadModal';
import Header from '@/components/dashboard/Header';
import ChatSidebar from '@/components/dashboard/ChatSidebar';
import {
  LogOut, Search, Plus, Flame, Zap, BarChart3,
  BookOpen, Target, AlertTriangle, ArrowRight, Trophy,
  MessageSquare, Brain
} from 'lucide-react';

/* ─── Daily study nudges ─── */
const DAILY_NUDGES = [
  'Consistency beats intensity. Even 15 minutes of focused study compounds over time.',
  "You don't have to be great to start, but you have to start to be great.",
  'The secret of getting ahead is getting started.',
  'Small daily improvements lead to stunning results.',
  'Every expert was once a beginner.',
  'The best time to study was yesterday. The second best time is now.',
  'Understanding deeply is better than memorizing broadly.',
  'Your brain rewires itself every time you study. Keep building those connections.',
  'Difficult concepts become simple with repetition and patience.',
  'Focus on progress, not perfection.',
];

/* ─── Types for API responses ─── */
interface ProfileData {
  xp: number;
  streak: number;
  longestStreak: number;
  totalSessions: number;
  averageScore: number;
  weakTopics: string[];
  strongTopics: string[];
  recentScores: number[];
  weeklyChallenge?: {
    description: string;
    target: number;
    progress: number;
    completed: boolean;
    xpReward: number;
  };
}

interface RecommendationItem {
  sessionId?: string;
  documentId: string;
  title: string;
  subject?: string;
  reason: string;
  weakTopics?: string[];
}

interface RecommendationsData {
  readyToTest: RecommendationItem[];
  weakSpots: RecommendationItem[];
}

/* ─────────────────────────────────────────────────────────────────── */

function HomeLearningContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChatOpen = searchParams.get('chat') === 'true';
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const [mounted, setMounted] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      setShowChat(isChatOpen);
    }
  }, [isChatOpen, mounted]);

  /* ── Core data states ── */
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);

  /* ── UI state ── */
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  /* ── Greeting state ── */
  const [greeting, setGreeting] = useState('Good day');
  const [subGreeting, setSubGreeting] = useState('Ready to study?');

  /* ── Stable daily nudge (changes once per day) ── */
  const dailyNudge = DAILY_NUDGES[new Date().getDate() % DAILY_NUDGES.length];

  /* ─── Data fetchers ─── */

  const fetchDocuments = async (showLoading = false) => {
    if (showLoading) setLoadingDocs(true);
    try {
      const res = await api.get<any>('/documents');
      const docList = Array.isArray(res) ? res : (res.documents || []);
      setDocuments(docList);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      if (showLoading) setLoadingDocs(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await api.get<any>('/profile');
      setProfile(res);
    } catch {
      // Graceful fail — new users won't have a profile yet
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await api.get<any>('/dashboard/recommendations');
      const data = res.data || res;
      setRecommendations(data);
    } catch {
      // Graceful fail — new users won't have recommendations
    }
  };

  /* ─── Effects ─── */

  useEffect(() => {
    fetchDocuments(true);
    fetchProfile();
    fetchRecommendations();
  }, []);

  // Poll for document status if any are pending/processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.processingStatus === 'processing' || doc.processingStatus === 'pending'
    );
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 4000);
    return () => clearInterval(interval);
  }, [documents]);

  // Update dynamic time-of-day greeting
  useEffect(() => {
    const hour = new Date().getHours();
    const isNewUser = documents.length === 0 && !loadingDocs;
    const name = user?.name || 'Student';

    if (isNewUser) {
      setGreeting(`Welcome to your study space, ${name}`);
      setSubGreeting("Let's add your first source to start studying.");
    } else {
      if (hour >= 5 && hour < 12) {
        setGreeting(`Good morning, ${name}`);
        setSubGreeting('Ready to study today?');
      } else if (hour >= 12 && hour < 17) {
        setGreeting(`Good afternoon, ${name}`);
        setSubGreeting('Ready to study this afternoon?');
      } else if (hour >= 17 && hour < 21) {
        setGreeting(`Good evening, ${name}`);
        setSubGreeting('Ready to study this evening?');
      } else {
        setGreeting(`Ready to chat in, ${name}?`);
        setSubGreeting('Welcome to your quiet study space.');
      }
    }
  }, [user, documents.length, loadingDocs]);

  /* ─── Handlers ─── */



  const handleStartSession = async (docId: string, mode: 'teach' | 'quiz') => {
    try {
      setStartingSession(true);
      const res = await api.post<{ sessionId: string }>('/sessions/start', {
        documentId: docId,
        mode: mode === 'teach' ? 'understand' : 'practice',
      });
      if (res.sessionId) {
        router.push(`/session/${res.sessionId}`);
      }
    } catch (err: any) {
      alert(`Failed to start session: ${err.message}`);
    } finally {
      setStartingSession(false);
    }
  };

  const handleUploadSuccess = (sessionId: string) => {
    fetchDocuments(false);
    router.push(`/session/${sessionId}`);
  };

  /* ─── Computed ─── */

  const subjects = [
    'All',
    ...Array.from(
      new Set(
        documents
          .map((d) => d.subject)
          .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      )
    ),
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSubject = selectedSubject === 'All' || doc.subject === selectedSubject;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Weekly challenge helpers
  const challenge = profile?.weeklyChallenge;
  const challengeProgress = challenge ? Math.min((challenge.progress / challenge.target) * 100, 100) : 0;

  // Recommendation helpers
  const hasReadyToTest = recommendations?.readyToTest && recommendations.readyToTest.length > 0;
  const hasWeakSpots = recommendations?.weakSpots && recommendations.weakSpots.length > 0;
  const hasRecommendations = hasReadyToTest || hasWeakSpots;

  /* ─── Render ─── */

  return (
    <ProtectedRoute>
      {showChat ? (
        <ChatSidebar
          isOpen={true}
          onClose={() => router.push('/home')}
        />
      ) : (
        <div className="min-h-screen bg-white text-brand-forest font-sans flex flex-col">

          {/* ── Shared Header ── */}
          <Header 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            onUploadClick={() => setIsUploadOpen(true)} 
          />

          {/* Mobile search */}
          <div className="px-6 pt-4 md:hidden">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-base sm:text-xs text-brand-forest focus:outline-none w-full placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          {/* ══════════════ MAIN ══════════════ */}
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 md:px-8 py-10 md:py-14 flex flex-col">

            {/* ── SECTION 1: Greeting + Nudge ── */}
            <div className="mb-8 text-left">
              <h1 className="text-3xl md:text-5xl font-medium tracking-tight text-brand-forest leading-[1.15]">
                {greeting}
              </h1>
              <p className="text-base text-gray-400 font-medium mt-2">
                {subGreeting}
              </p>
              <p className="text-sm text-gray-300 font-normal mt-3 italic max-w-xl leading-relaxed">
                &ldquo;{dailyNudge}&rdquo;
              </p>
            </div>

            {/* ── SECTION 5: Subject Filters ── */}
            {documents.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 text-left scrollbar-none">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedSubject === sub
                        ? 'bg-brand-green text-white shadow-sm'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-brand-forest'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

            {/* ── SECTION: Study Recommendations ── */}
            {hasRecommendations && (
              <div className="mb-10 text-left animate-in fade-in duration-200">
                <h2 className="text-xs font-bold text-brand-forest uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-brand-green animate-pulse" />
                  <span>Revision Actions & Weak Spots</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Weak Spot revisions */}
                  {recommendations?.weakSpots && recommendations.weakSpots.map((rec, idx) => (
                    <div key={`weak-${idx}`} className="bg-gradient-to-br from-white to-[#FAF6F2] border border-rose-100 rounded-3xl p-5 shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-all relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose-500/30" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Weak Area Detected
                        </span>
                        <h4 className="font-extrabold text-sm text-brand-forest leading-snug line-clamp-1 pr-6 group-hover:text-rose-700 transition-colors">
                          Review {rec.weakTopics?.join(', ') || 'concepts'} in {rec.title}
                        </h4>
                        <p className="text-[11.5px] text-gray-400 font-semibold leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                      <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-rose-100/40 w-full justify-between items-center text-left">
                        <span className="text-[10px] font-bold text-zinc-400">
                          {rec.subject || 'General'}
                        </span>
                        <button
                          onClick={() => handleStartSession(rec.documentId, 'teach')}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-3xs"
                        >
                          Review Now
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Ready to Test revisions */}
                  {recommendations?.readyToTest && recommendations.readyToTest.map((rec, idx) => (
                    <div key={`test-${idx}`} className="bg-gradient-to-br from-white to-[#F6FAF2] border border-brand-green/20 rounded-3xl p-5 shadow-3xs flex flex-col justify-between hover:shadow-2xs transition-all relative overflow-hidden group">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand-green/25" />
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-brand-green bg-brand-green/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Ready for Assessment
                        </span>
                        <h4 className="font-extrabold text-sm text-brand-forest leading-snug line-clamp-1 pr-6 group-hover:text-brand-green transition-colors">
                          Assessment prompt for {rec.title}
                        </h4>
                        <p className="text-[11.5px] text-gray-400 font-semibold leading-relaxed">
                          {rec.reason}
                        </p>
                      </div>
                      <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-brand-green/15 w-full justify-between items-center text-left">
                        <span className="text-[10px] font-bold text-zinc-400">
                          {rec.subject || 'General'}
                        </span>
                        <button
                          onClick={() => handleStartSession(rec.documentId, 'quiz')}
                          className="px-3.5 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-black rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-3xs"
                        >
                          Take Test
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── SECTION 6: Your Library ── */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold text-brand-forest uppercase tracking-wider">
                  Your Library
                </h2>
                {documents.length > 0 && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    {documents.length} source{documents.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green/95 active:scale-[0.98] transition-all px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Source</span>
              </button>
            </div>

            {loadingDocs ? (
              <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-5 animate-pulse">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-gray-100/50 border border-gray-150 rounded-2xl p-5 aspect-[1.35/1] sm:aspect-[1.4/1] flex flex-col justify-between">
                    <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                    <div className="space-y-2 mt-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-150 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredDocuments.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                      {/* Create notebook (Mobile) */}
                      <div
                        onClick={() => setIsUploadOpen(true)}
                        className="flex sm:hidden items-center gap-3.5 w-full p-4 rounded-[16px] border border-dashed border-gray-300 bg-white hover:bg-gray-50/50 cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                          <Plus className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-bold text-[13px] text-brand-forest">
                          Create notebook
                        </span>
                      </div>

                      {/* Create notebook (Desktop) */}
                      <div
                        onClick={() => setIsUploadOpen(true)}
                        className="hidden sm:flex border border-dashed border-gray-250 hover:border-brand-green/30 bg-white rounded-2xl flex-col items-center justify-center p-5 cursor-pointer hover:bg-gray-50/55 transition-all duration-200 aspect-[1.35/1] sm:aspect-[1.4/1]"
                      >
                        <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-3">
                          <Plus className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-xs text-brand-forest">
                          Create notebook
                        </span>
                      </div>

                      {filteredDocuments.slice(0, 3).map((doc) => (
                        <DocumentCard
                          key={doc.id || doc._id}
                          doc={doc}
                          onStartSession={handleStartSession}
                          onDeleteSuccess={() => fetchDocuments(false)}
                        />
                      ))}
                    </div>

                    {filteredDocuments.length > 3 && (
                      <div className="mt-8 flex justify-center">
                        <button
                          onClick={() => router.push('/library')}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-500 hover:text-brand-green hover:border-brand-green/30 hover:bg-gray-100/50 transition-all cursor-pointer shadow-3xs hover:scale-[1.01]"
                        >
                          Explore more of your uploaded notebooks in the Library
                          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  !searchQuery ? (
                    <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50/20 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-6 animate-in fade-in duration-200">
                      <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                        <Plus className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-brand-forest">Add your first source</h3>
                        <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                          Upload a PDF or image. Braudle will analyze and map your source material for interactive study.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsUploadOpen(true)}
                        className="px-5 py-2.5 rounded-full bg-brand-green hover:bg-brand-green/95 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        Upload Document
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-100 rounded-3xl p-12 text-center bg-gray-50/50 text-left">
                      <p className="text-sm font-semibold text-brand-forest">No sources matched your search.</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-3 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                      >
                        Clear search query
                      </button>
                    </div>
                  )
                )}

              </div>
            )}

          </main>

          {/* ── Upload Modal ── */}
          <UploadModal
            isOpen={isUploadOpen}
            onClose={() => setIsUploadOpen(false)}
            onUploadSuccess={handleUploadSuccess}
          />

          {/* ── Session starting overlay ── */}
          {startingSession && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/30 backdrop-blur-xs">
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-brand-green" />
                <span className="text-xs font-bold text-brand-forest">Preparing tutoring environment...</span>
              </div>
            </div>
          )}



        </div>
      )}
    </ProtectedRoute>
  );
}

export default function HomeLearningPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center animate-pulse">
        <div className="w-8 h-8 rounded-full border-4 border-gray-150 border-t-brand-green animate-spin" />
      </div>
    }>
      <HomeLearningContent />
    </Suspense>
  );
}

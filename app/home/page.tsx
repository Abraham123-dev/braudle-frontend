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
  MessageSquare
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

            {/* ── SECTION 2: Stats Overview Row ── */}
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {/* Streak */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Flame className="w-4.5 h-4.5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-forest leading-none">
                      {profile.streak}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">day streak</p>
                  </div>
                </div>

                {/* XP */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                    <Zap className="w-4.5 h-4.5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-forest leading-none">
                      {profile.xp}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">total XP</p>
                  </div>
                </div>

                {/* Avg Score */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4.5 h-4.5 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-forest leading-none">
                      {profile.averageScore}%
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">avg score</p>
                  </div>
                </div>

                {/* Total Sessions */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-brand-forest leading-none">
                      {profile.totalSessions}
                    </p>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">sessions</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 3: Weekly Challenge Banner ── */}
            {challenge && !challenge.completed && (
              <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-brand-yellow/20 flex items-center justify-center shrink-0">
                  <Trophy className="w-4.5 h-4.5 text-brand-forest" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-brand-forest">
                    Weekly Challenge
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {challenge.description} &mdash; <span className="text-brand-green font-bold">+{challenge.xpReward} XP</span>
                  </p>
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-brand-green h-full rounded-full transition-all duration-500"
                        style={{ width: `${challengeProgress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 shrink-0">
                      {challenge.progress}/{challenge.target}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION 4: Smart Recommendations ── */}
            {hasRecommendations && (
              <div className="mb-10">
                <h2 className="text-sm font-bold text-brand-forest mb-4 uppercase tracking-wider">
                  Suggested for you
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">

                  {/* Ready to Test cards */}
                  {recommendations?.readyToTest?.map((item) => (
                    <div
                      key={`test-${item.sessionId || item.documentId}`}
                      className="bg-white border border-gray-100 rounded-2xl p-4 min-w-[240px] max-w-[280px] shrink-0 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target className="w-3.5 h-3.5 text-brand-green" />
                          <span className="text-[10px] font-bold text-brand-green uppercase tracking-wider">
                            Ready to test
                          </span>
                        </div>
                        <p className="text-sm font-bold text-brand-forest line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                        {item.subject && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-gray-50 text-[10px] font-bold text-gray-500">
                            {item.subject}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartSession(item.documentId, 'quiz')}
                        className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-brand-green text-white hover:bg-brand-green/90 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Take Quiz <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Weak Spots cards */}
                  {recommendations?.weakSpots?.map((item) => (
                    <div
                      key={`weak-${item.documentId}`}
                      className="bg-white border border-gray-100 rounded-2xl p-4 min-w-[240px] max-w-[280px] shrink-0 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                            Needs attention
                          </span>
                        </div>
                        <p className="text-sm font-bold text-brand-forest line-clamp-2 leading-snug">
                          {item.title}
                        </p>
                        {item.weakTopics && item.weakTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.weakTopics.slice(0, 3).map((topic) => (
                              <span
                                key={topic}
                                className="px-2 py-0.5 rounded-full bg-orange-50 text-[10px] font-bold text-orange-600"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleStartSession(item.documentId, 'teach')}
                        className="mt-3 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-gray-200 text-brand-forest hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]"
                      >
                        Review <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                </div>
              </div>
            )}

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

            {/* ── SECTION 6: Your Library ── */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-brand-forest uppercase tracking-wider">
                Your Library
              </h2>
              {documents.length > 0 && (
                <span className="text-[11px] text-gray-400 font-medium">
                  {documents.length} source{documents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loadingDocs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse select-none">
                {/* Add Source placeholder */}
                <div className="border-2 border-dashed border-gray-100 rounded-3xl min-h-[220px] flex flex-col items-center justify-center p-6 opacity-60">
                  <div className="w-12 h-12 rounded-full bg-gray-50 mb-4" />
                  <div className="h-4 w-24 bg-gray-50 rounded-full mb-2" />
                  <div className="h-3 w-32 bg-gray-50 rounded-full" />
                </div>

                {/* 5 Shimmer Skeleton cards */}
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-5 w-16 bg-gray-100 rounded-full" />
                        <div className="h-3 w-12 bg-gray-100 rounded-full" />
                      </div>
                      <div className="h-4 w-3/4 bg-gray-100 rounded-full mb-3" />
                      <div className="h-4 w-1/2 bg-gray-100 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-50/50">
                      <div className="h-9 bg-gray-100 rounded-xl" />
                      <div className="h-9 bg-gray-100 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Add Source Card */}
                <div
                  onClick={() => setIsUploadOpen(true)}
                  className="border-2 border-dashed border-gray-200 hover:border-brand-green/40 hover:bg-brand-green/5 cursor-pointer rounded-3xl min-h-[110px] sm:min-h-[220px] flex flex-col items-center justify-center text-center p-3 sm:p-6 transition-all duration-300 group"
                >
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-1.5 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                    <Plus className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-forest mb-1">
                    Upload
                  </h3>
                  <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                    Upload a PDF or image to start study sessions.
                  </p>
                </div>

                {/* Chat with Braudle Card */}
                <Link
                  href="/home?chat=true"
                  className="border-2 border-solid border-brand-green/20 hover:border-brand-green/40 hover:bg-brand-green/5 cursor-pointer rounded-3xl min-h-[110px] sm:min-h-[220px] flex flex-col items-center justify-center text-center p-3 sm:p-6 transition-all duration-300 group bg-white shadow-2xs"
                >
                  <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-1.5 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                    <MessageSquare className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-forest mb-1">
                    Chat with Braudle
                  </h3>
                  <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                    Ask general questions, solve equations, or upload study files.
                  </p>
                </Link>

                {/* Document cards */}
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id || doc._id}
                    doc={doc}
                    onStartSession={handleStartSession}
                    onDeleteSuccess={() => fetchDocuments(false)}
                  />
                ))}

                {/* Search Empty State */}
                {filteredDocuments.length === 0 && searchQuery && (
                  <div className="col-span-full border border-gray-100 rounded-3xl p-12 text-center bg-gray-50/50">
                    <p className="text-sm font-semibold text-brand-forest">No sources matched your search.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                    >
                      Clear search query
                    </button>
                  </div>
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

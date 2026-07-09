'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import Header from '@/components/dashboard/Header';
import DocumentCard, { Document } from '@/components/dashboard/DocumentCard';
import UploadModal from '@/components/dashboard/UploadModal';
import { 
  Plus, 
  Search, 
  BookOpen, 
  AlertTriangle,
  Award,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  XCircle,
  X,
  ExternalLink,
  FileText,
  Brain
} from 'lucide-react';

export default function LibraryPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  /* ── Core data states ── */
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  /* ── UI state ── */
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'notebooks' | 'flashcards' | 'history'>('notebooks');

  /* ── Flashcards & History state ── */
  const [globalFlashcards, setGlobalFlashcards] = useState<any[]>([]);
  const [loadingFlashcards, setLoadingFlashcards] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [selectedQuizDetails, setSelectedQuizDetails] = useState<any | null>(null);
  const [loadingQuizDetails, setLoadingQuizDetails] = useState(false);

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

  /* ─── Fetchers for new tabs ─── */
  const fetchGlobalFlashcards = async () => {
    setLoadingFlashcards(true);
    try {
      const res = await api.get<any>('/sessions/flashcards');
      if (res.status === 'success' && res.library) {
        setGlobalFlashcards(res.library);
      } else {
        setGlobalFlashcards([]);
      }
    } catch (err) {
      console.error('Failed to fetch flashcards:', err);
    } finally {
      setLoadingFlashcards(false);
    }
  };

  const fetchQuizHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get<any>('/quiz/history');
      if (res.status === 'success' && res.quizzes) {
        setQuizHistory(res.quizzes);
      } else {
        setQuizHistory([]);
      }
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReviewQuiz = async (quizId: string) => {
    setLoadingQuizDetails(true);
    setSelectedQuizDetails(null);
    try {
      const res = await api.get<any>(`/quiz/${quizId}`);
      if (res) {
        setSelectedQuizDetails(res);
      }
    } catch (err: any) {
      alert(`Failed to fetch quiz details: ${err.message}`);
    } finally {
      setLoadingQuizDetails(false);
    }
  };

  /* ─── Effects ─── */

  useEffect(() => {
    fetchDocuments(true);
  }, []);

  useEffect(() => {
    if (activeTab === 'flashcards') {
      fetchGlobalFlashcards();
    } else if (activeTab === 'history') {
      fetchQuizHistory();
    }
  }, [activeTab]);

  const getSubjectColor = (subject?: string) => {
    if (!subject) return 'bg-teal-50 text-teal-700 border-teal-150';
    const sub = subject.toLowerCase();
    if (sub.includes('bio') || sub.includes('life') || sub.includes('botany') || sub.includes('zoology')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-150';
    }
    if (sub.includes('chem') || sub.includes('phys') || sub.includes('science') || sub.includes('nature')) {
      return 'bg-indigo-50 text-indigo-700 border-indigo-150';
    }
    if (sub.includes('math') || sub.includes('calculus') || sub.includes('econ') || sub.includes('finance') || sub.includes('accounting')) {
      return 'bg-amber-50 text-amber-700 border-amber-150';
    }
    if (sub.includes('hist') || sub.includes('art') || sub.includes('lit') || sub.includes('lang') || sub.includes('english') || sub.includes('social')) {
      return 'bg-violet-50 text-violet-700 border-violet-150';
    }
    return 'bg-teal-50 text-teal-700 border-teal-150';
  };

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

  return (
    <ProtectedRoute>
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
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-3xl font-medium tracking-tight text-brand-forest">
                Your Library
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Manage your study documents and start teaching sessions
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green/95 active:scale-[0.98] transition-all px-4.5 py-2 text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Source</span>
              </button>
            </div>
          </div>

          {/* Subject Filters */}
          {activeTab === 'notebooks' && subjects.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      selectedSubject === sub
                        ? 'bg-brand-forest text-white'
                        : 'bg-gray-50 text-gray-400 hover:text-brand-forest hover:bg-gray-100 border border-gray-100/50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}

          {/* Main Library Navigation Tabs */}
          <div className="flex border-b border-gray-200/80 mb-8 gap-6 text-sm font-semibold select-none">
            <button
              onClick={() => setActiveTab('notebooks')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'notebooks'
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-400 hover:text-brand-forest'
              }`}
            >
              Notebooks
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'flashcards'
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-400 hover:text-brand-forest'
              }`}
            >
              Saved Flashcards
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                activeTab === 'history'
                  ? 'border-brand-green text-brand-green font-bold'
                  : 'border-transparent text-gray-400 hover:text-brand-forest'
              }`}
            >
              Practice History
            </button>
          </div>

          {/* Tab 1: Notebooks List */}
          {activeTab === 'notebooks' && (
            loadingDocs ? (
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

                    {filteredDocuments.map((doc) => (
                      <DocumentCard
                        key={doc.id || doc._id}
                        doc={doc}
                        onStartSession={handleStartSession}
                        onDeleteSuccess={() => fetchDocuments(false)}
                      />
                    ))}
                  </div>
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
            )
          )}

          {/* Tab 2: Saved Flashcards */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6 text-left">
              {loadingFlashcards ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 h-48" />
                  ))}
                </div>
              ) : globalFlashcards.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50/50">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-brand-forest">No saved flashcards yet.</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Flashcards generated during study sessions will appear here so you can review them anytime.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {globalFlashcards.map((docGroup, dIdx) => (
                    <div key={dIdx} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-sm text-brand-forest truncate max-w-[200px]" title={docGroup.documentTitle}>
                            {docGroup.documentTitle}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                            Saved Deck
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          {docGroup.topics?.map((topicItem: any, tIdx: number) => (
                            <div key={tIdx} className="border-t border-gray-50 pt-4 first:border-0 first:pt-0">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Topic: {topicItem.topic}
                              </h4>
                              
                              <div className="grid gap-4">
                                {topicItem.cards?.map((card: any, cIdx: number) => {
                                  const cardKey = `${dIdx}-${tIdx}-${cIdx}`;
                                  const isFlipped = !!flippedCards[cardKey];
                                  return (
                                    <div
                                      key={cIdx}
                                      onClick={() => setFlippedCards(prev => ({ ...prev, [cardKey]: !isFlipped }))}
                                      className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 text-center min-h-[90px] flex flex-col items-center justify-center relative select-none ${
                                        isFlipped
                                          ? 'bg-teal-50/10 border-teal-200/50 hover:border-teal-300'
                                          : 'bg-amber-50/10 border-amber-200/50 hover:border-amber-300'
                                      }`}
                                    >
                                      {!isFlipped ? (
                                        <div className="space-y-1">
                                          <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider bg-amber-100/50 px-1.5 py-0.5 rounded">FRONT</span>
                                          <p className="text-xs font-bold text-brand-forest leading-relaxed">
                                            {card.front}
                                          </p>
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          <span className="text-[8px] font-bold text-teal-600 uppercase tracking-wider bg-teal-100/50 px-1.5 py-0.5 rounded">BACK</span>
                                          <p className="text-xs font-medium text-brand-forest leading-relaxed">
                                            {card.back}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Practice History */}
          {activeTab === 'history' && (
            <div className="space-y-6 text-left">
              {loadingHistory ? (
                <div className="space-y-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl h-16 w-full" />
                  ))}
                </div>
              ) : quizHistory.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50/50">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm font-semibold text-brand-forest">No practice tests taken yet.</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                    Start a study session and generate practice tests inside the workspace. Your past performance history will appear here.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-150 shadow-xs rounded-3xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150">
                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-forest/65">Notebook / Source</th>
                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-forest/65">Subject</th>
                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-forest/65">Date Taken</th>
                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-forest/65">Score</th>
                        <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-brand-forest/65 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quizHistory.map((quizItem) => {
                        const dateStr = quizItem.submittedAt 
                          ? new Date(quizItem.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'Pending evaluation';
                        const scoreNum = typeof quizItem.score === 'number' ? quizItem.score : null;
                        
                        let scoreBadge = '';
                        if (scoreNum === null) {
                          scoreBadge = 'bg-gray-50 text-gray-400 border-gray-200/50';
                        } else if (scoreNum >= 80) {
                          scoreBadge = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                        } else if (scoreNum >= 50) {
                          scoreBadge = 'bg-amber-50 text-amber-700 border-amber-100';
                        } else {
                          scoreBadge = 'bg-rose-50 text-rose-700 border-rose-100';
                        }

                        const subjectStyle = getSubjectColor(quizItem.subject);

                        return (
                          <tr key={quizItem._id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <FileText className="w-4 h-4 text-brand-green shrink-0" />
                                <span className="font-bold text-xs text-brand-forest truncate max-w-[220px]" title={quizItem.documentTitle}>
                                  {quizItem.documentTitle}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${subjectStyle}`}>
                                {quizItem.subject || 'General'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-gray-400 font-semibold">{dateStr}</td>
                            <td className="py-4 px-6">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${scoreBadge}`}>
                                {scoreNum !== null ? `${scoreNum}%` : 'Grading...'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleReviewQuiz(quizItem._id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-green hover:underline cursor-pointer"
                              >
                                Review Answers <ExternalLink className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Review Quiz Details Modal */}
              {selectedQuizDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                  <div className="bg-white rounded-3xl border border-gray-100 max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 text-left shadow-2xl relative animate-in zoom-in-95 duration-200">
                    <button
                      onClick={() => setSelectedQuizDetails(null)}
                      className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer border border-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green bg-brand-green/5 border border-brand-green/10 px-2.5 py-1 rounded-full">
                        Quiz Performance Review
                      </span>
                      <h3 className="font-extrabold text-base text-brand-forest mt-3 leading-tight">
                        {selectedQuizDetails.documentTitle || 'Notebook Assessment'}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-semibold mt-1">
                        Completed on {new Date(selectedQuizDetails.submittedAt).toLocaleString()} • Score: {selectedQuizDetails.score}%
                      </p>
                    </div>

                    <div className="space-y-4">
                      {selectedQuizDetails.questions?.map((q: any, idx: number) => {
                        const isCorrect = q.isCorrect;
                        return (
                          <div key={idx} className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-3">
                            <div className="flex gap-2.5 items-start justify-between">
                              <div className="flex gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-green/10 text-brand-green font-bold text-[10px]">
                                  {idx + 1}
                                </span>
                                <h4 className="font-bold text-xs text-brand-forest leading-relaxed">
                                  {q.question}
                                </h4>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                                isCorrect 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </span>
                            </div>

                            <div className="space-y-2 pl-7">
                              <div className="text-[11px] text-gray-500 font-medium">
                                <span className="font-bold text-brand-forest">Your Answer: </span>
                                <span className={isCorrect ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                                  {q.studentAnswer || '(No response)'}
                                </span>
                              </div>
                              
                              {!isCorrect && (
                                <div className="text-[11px] text-gray-500 font-medium">
                                  <span className="font-bold text-brand-forest">Correct Answer: </span>
                                  <span className="text-brand-green font-semibold">{q.answer}</span>
                                </div>
                              )}

                              {q.feedback && (
                                <div className="p-3 bg-white border border-gray-100/80 rounded-xl text-xs text-gray-500 leading-relaxed font-normal">
                                  <strong className="text-brand-forest font-bold text-[11px] block mb-1">Feedback:</strong>
                                  {q.feedback}
                                </div>
                              )}

                              {q.explanation && (
                                <div className="text-[11px] text-gray-400 font-medium italic">
                                  <strong>Explanation: </strong>{q.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setSelectedQuizDetails(null)}
                        className="px-6 py-2.5 rounded-xl bg-brand-forest hover:bg-brand-forest/90 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Close Review
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading overlay for fetching specific quiz details */}
          {loadingQuizDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/30 backdrop-blur-xs">
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-brand-green animate-ping" />
                <span className="text-xs font-bold text-brand-forest">Retrieving quiz submission details...</span>
              </div>
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
    </ProtectedRoute>
  );
}

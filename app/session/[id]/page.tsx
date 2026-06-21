'use client';

import React, { useRef, useEffect, use } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSession } from '@/hooks/useSession';
import PracticePanel from '@/components/quiz/PracticePanel';
import MarkdownRenderer from '@/components/tutor/MarkdownRenderer';
import LeftSidebar from '@/components/tutor/LeftSidebar';
import ConceptExplanationModal from '@/components/tutor/ConceptExplanationModal';
import { AddNoteModal, EditNoteModal } from '@/components/tutor/SessionNotesModals';
import { 
  BookOpen, 
  Award, 
  ArrowLeft, 
  Send, 
  AlertCircle,
  FileText,
  ChevronRight,
  FileQuestion,
  Plus,
  Trash2,
  X,
  Brain,
  Sparkles
} from 'lucide-react';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface FlashcardItem {
  topic: string;
  front: string;
  back: string;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { id: sessionId } = use(params);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Consume modular session hook
  const {
    loading,
    error,
    isProcessingDoc,
    processingStage,
    docTitle,
    topics,
    messages,
    input,
    setInput,
    activeMode,
    isStreaming,
    streamingContent,
    timeGreeting,
    quiz,
    setQuiz,
    selectedAnswers,
    setSelectedAnswers,
    loadingQuiz,
    submittingQuiz,
    quizResult,
    setQuizResult,
    showRightPane,
    setShowRightPane,
    handleSendMessage,
    handleModeChange,
    handleGenerateQuiz,
    handleQuizSubmit,
    handleFinishSession,
    handleGradeQuestion,
    docSummary,
    sessionQuizzes,
    fetchSessionQuizzes
  } = useSession(sessionId);

  // Local Notes State
  const [notes, setNotes] = React.useState<SavedNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<SavedNote | null>(null);

  // Tab State for Right Panel
  const [rightPanelTab, setRightPanelTab] = React.useState<'studio' | 'quiz' | 'flashcards'>('studio');
  const [activeMobileTab, setActiveMobileTab] = React.useState<'sources' | 'chat' | 'studio'>('chat');
  const [isExamSession, setIsExamSession] = React.useState(false);
  const [flashcardCount, setFlashcardCount] = React.useState(15);
  const [flashcardFocus, setFlashcardFocus] = React.useState('');
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = React.useState(false);

  const hasChatted = messages.some((msg) => msg.role === 'user');

  const [isExpandedRightPane, setIsExpandedRightPane] = React.useState(false);

  const handleExplainQuizQuestion = (question: any, studentAnswer: string, correctAnswer: string) => {
    const userMessage = `I am taking a quiz on this material and was given this question: "${question.question}"\n\nI chose this as the answer: "${studentAnswer}"\n\nThat answer was incorrect. The correct answer is "${correctAnswer}".\n\nHelp me understand why my answer was incorrect.`;
    setInput(userMessage);
    setActiveMobileTab('chat');
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      sendBtn?.click();
    }, 150);
  };

  // Flashcards state
  const [flashcards, setFlashcards] = React.useState<FlashcardItem[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Load saved quiz helper
  const handleLoadSavedQuiz = (q: any) => {
    setIsExamSession(!!q.isExam);
    setQuiz(q);
    if (q.score !== undefined) {
      setQuizResult({ score: q.score, quiz: q });
    } else {
      setQuizResult(null);
    }
    const answersMap: Record<string, string> = {};
    q.questions.forEach((question: any) => {
      if (question.studentAnswer) {
        answersMap[question._id] = question.studentAnswer;
      }
    });
    setSelectedAnswers(answersMap);
    setRightPanelTab('quiz');
    setShowRightPane(true);
  };

  // Combine saved notes, completed quizzes/exams, and flashcard decks
  const combinedItems = React.useMemo(() => {
    const list: any[] = [];
    
    // Add notes
    notes.forEach(note => {
      list.push({
        type: 'note',
        id: note.id,
        title: note.title,
        date: note.createdAt,
        raw: note
      });
    });
    
    // Add quizzes
    sessionQuizzes.forEach(q => {
      list.push({
        type: 'quiz',
        id: q._id,
        title: q.isExam ? 'Exam Simulation' : 'Practice Test',
        subtitle: `${q.totalQuestions} questions · ${q.score !== undefined ? `Scored ${q.score}%` : 'In Progress'}`,
        date: q.submittedAt || q.createdAt,
        raw: q
      });
    });

    // Add active flashcards deck if present
    if (flashcards.length > 0) {
      list.push({
        type: 'flashcards',
        id: 'session-flashcards',
        title: 'Flashcards Deck',
        subtitle: `${flashcards.length} memory cards`,
        date: new Date().toISOString(),
        raw: flashcards
      });
    }
    
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, sessionQuizzes, flashcards]);



  // Show right pane by default on desktop, keep collapsed on mobile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDesktop = window.innerWidth >= 1024;
      setShowRightPane(isDesktop);
    }
  }, [setShowRightPane]);

  // Load notes from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`braudle_notes_${sessionId}`);
      if (stored) {
        try {
          setNotes(JSON.parse(stored));
        } catch {}
      }
    }
  }, [sessionId]);

  // Scan messages to extract flashcards dynamically
  useEffect(() => {
    const extracted: FlashcardItem[] = [];
    messages.forEach((msg) => {
      if (msg.role === 'assistant') {
        const lines = msg.content.split('\n');
        lines.forEach((line) => {
          if (line.includes('FLASHCARD |')) {
            const parts = line.split('|').map((p) => p.trim());
            let topic = '';
            let front = '';
            let back = '';
            parts.forEach((part) => {
              if (part.startsWith('TOPIC:')) topic = part.replace('TOPIC:', '').trim();
              if (part.startsWith('FRONT:')) front = part.replace('FRONT:', '').trim();
              if (part.startsWith('BACK:')) back = part.replace('BACK:', '').trim();
            });
            if (front && back) {
              extracted.push({ topic: topic || 'General', front, back });
            }
          }
        });
      }
    });
    setFlashcards(extracted);
  }, [messages]);

  // Auto-scroll on new chat logs or stream segments using container-scoped scroll
  useEffect(() => {
    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
      if (chatContainerRef.current) {
        const container = chatContainerRef.current;
        container.scrollTo({
          top: container.scrollHeight,
          behavior,
        });
      }
    };

    scrollToBottom('smooth');
    // Catch post-render/hydration sizing shifts (e.g. KaTeX math blocks sizing)
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, streamingContent]);

  // Handle Add Note
  const handleSaveNewNote = (title: string, content: string) => {
    const newNote: SavedNote = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    localStorage.setItem(`braudle_notes_${sessionId}`, JSON.stringify(updated));
    setIsAddNoteOpen(false);
  };

  // Handle Edit Note
  const handleUpdateNote = (noteId: string, updatedTitle: string, updatedContent: string) => {
    const updated = notes.map((n) =>
      n.id === noteId ? { ...n, title: updatedTitle, content: updatedContent } : n
    );
    setNotes(updated);
    localStorage.setItem(`braudle_notes_${sessionId}`, JSON.stringify(updated));
    setSelectedNote(null);
  };

  // Handle Delete Note
  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId);
    setNotes(updated);
    localStorage.setItem(`braudle_notes_${sessionId}`, JSON.stringify(updated));
    setSelectedNote(null);
  };

  // Concept Click action
  const handleConceptClick = (topicName: string) => {
    setInput(`Explain the concept of ${topicName} in detail.`);
    setActiveMobileTab('chat');
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      sendBtn?.click();
    }, 150);
  };

  const handleCreateCustomFlashcards = async (count: number, focus: string) => {
    if (isStreaming) return;
    setIsGeneratingFlashcards(true);
    try {
      await handleModeChange('flashcards');
      const userText = `Please generate exactly ${count} flashcards from our study materials.${
        focus.trim() ? ` Custom focus instructions: "${focus.trim()}"` : ''
      }`;
      setFlashcards([]);
      setCurrentFlashcardIdx(0);
      setIsFlipped(false);
      
      setInput(userText);
      setTimeout(() => {
        const sendBtn = document.getElementById('chat-send-btn');
        sendBtn?.click();
      }, 150);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleSendMessageWrapper = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim().toLowerCase();
    const isQuizReq = userText.includes('quiz') || userText.includes('practice question') || userText.includes('practice test') || userText.includes('test me');
    const isExamReq = userText.includes('exam') || userText.includes('mock exam');
    const isFcReq = userText.includes('flashcard') || userText.includes('flash card');

    if (isQuizReq) {
      setIsExamSession(false);
      setQuiz(null);
      setQuizResult(null);
      setRightPanelTab('quiz');
      setActiveMobileTab('studio');
      setShowRightPane(true);
    } else if (isExamReq) {
      setIsExamSession(true);
      setQuiz(null);
      setQuizResult(null);
      setRightPanelTab('quiz');
      setActiveMobileTab('studio');
      setShowRightPane(true);
    } else if (isFcReq) {
      setRightPanelTab('flashcards');
      setActiveMobileTab('studio');
      setShowRightPane(true);
    }

    handleSendMessage(e);
  };

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 bg-[#F0F4F9] text-brand-forest font-sans flex flex-col selection:bg-brand-lime selection:text-brand-green overflow-hidden">
        
        {/* Workspace Top Header: Dynamic PDF Title */}
        <header className="py-4 px-6 md:px-8 bg-[#F0F4F9] sticky top-0 z-40 animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Back Arrow & Document Details */}
            <div className="flex items-center gap-4 min-w-0">
              <a 
                href="/home"
                className="p-2 rounded-xl text-gray-400 hover:text-brand-forest hover:bg-gray-150 bg-white border border-gray-200/80 transition-all cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </a>
              
              <div className="min-w-0 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
                  Study Space
                </span>
                <h1 className="text-base md:text-lg font-bold text-brand-forest truncate leading-tight" title={docTitle}>
                  {docTitle}
                </h1>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex items-center gap-3">
              {/* Show right panel toggle on desktop if collapsed */}
              {!showRightPane && (
                <button
                  onClick={() => setShowRightPane(true)}
                  className="hidden lg:block px-4 py-2 text-xs font-bold border border-gray-250 hover:bg-gray-50 rounded-full transition-all cursor-pointer"
                >
                  Show Studio
                </button>
              )}
              {/* Sync to Brain / Complete Session */}
              <button
                onClick={handleFinishSession}
                disabled={loading}
                className="rounded-full bg-brand-green hover:bg-brand-green/90 px-5 py-2 text-xs font-bold text-white hover:scale-[1.01] transition-all cursor-pointer shadow-sm active:scale-[0.98] disabled:opacity-40 flex items-center gap-1.5"
                title="Sync and analyze session to update your learning brain"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Sync to Brain</span>
              </button>
            </div>

          </div>
        </header>

        {loading ? (
          /* Skeleton Workspace Layout */
          <div className="flex-1 flex relative overflow-hidden animate-pulse select-none">
            {/* Left Sidebar Skeleton */}
            <aside className="hidden lg:flex w-72 border-r border-gray-100 bg-white p-6 flex-col justify-between shrink-0">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="h-3 w-20 bg-gray-100 rounded-full" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-16 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-24 bg-gray-100 rounded-lg" />
                    <div className="h-6 w-20 bg-gray-100 rounded-lg" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-28 bg-gray-100 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl" />
                    <div className="h-14 bg-gray-50 border border-gray-100 rounded-2xl" />
                  </div>
                </div>
              </div>
              <div className="h-4 w-32 bg-gray-100 rounded-full" />
            </aside>

            {/* Center Chat Skeleton */}
            <section className="flex-1 flex flex-col bg-white overflow-hidden">
              <div className="border-b border-gray-50 py-3.5 px-6">
                <div className="h-3 w-32 bg-gray-100 rounded-full" />
              </div>
              <div className="flex-1 p-6 md:p-8 space-y-6">
                <div className="max-w-2xl bg-gray-50/50 border border-gray-100 rounded-3xl p-6 space-y-4">
                  <div className="h-4 w-40 bg-gray-100 rounded-full" />
                  <div className="h-3 w-full bg-gray-100 rounded-full" />
                </div>
              </div>
              <div className="border-t border-gray-100 p-6 space-y-4">
                <div className="h-12 bg-gray-50 border border-gray-100 rounded-2xl" />
              </div>
            </section>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full border border-gray-100 rounded-3xl p-8 space-y-6">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-brand-forest">{error}</p>
              <a 
                href="/home"
                className="w-full block py-3 bg-brand-green text-white rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all text-center"
              >
                Return to Home Learning
              </a>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Mobile Navigation Tabs (visible only on mobile/tablet) */}
            <div className="lg:hidden flex border-b border-zinc-200/80 bg-[#F0F4F9] px-4 shrink-0 justify-around select-none">
              {[
                { id: 'sources', label: 'Key Concepts' },
                { id: 'chat', label: 'Chat' },
                { id: 'studio', label: 'Braudle Modes' },
              ].map((tab) => {
                const isActive = activeMobileTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveMobileTab(tab.id as 'sources' | 'chat' | 'studio')}
                    className={`py-3.5 px-4 text-xs font-extrabold transition-all relative border-b-2 cursor-pointer ${
                      isActive 
                        ? 'text-brand-forest border-brand-green font-black' 
                        : 'text-gray-400 border-transparent hover:text-brand-forest'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 min-h-0 flex relative overflow-hidden p-3 sm:p-4 lg:p-5 pt-3 sm:pt-0 gap-4">
              
              {/* PANEL 1: LEFT SIDEBAR (Sources & Key Concepts) */}
              <LeftSidebar
                docTitle={docTitle}
                topics={topics}
                onConceptClick={handleConceptClick}
                className={activeMobileTab === 'sources' 
                  ? 'flex flex-1 w-full bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 flex-col justify-between overflow-y-auto shrink-0 select-none text-left animate-in fade-in duration-200' 
                  : 'hidden lg:flex w-72 bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 flex-col justify-between overflow-y-auto shrink-0 select-none text-left'}
              />

              {/* PANEL 2: CENTER CANVAS (Tutor Chat Space) */}
              <section className={`flex-1 flex flex-col bg-white border border-gray-200/80 shadow-xs rounded-3xl overflow-hidden ${
                activeMobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
              }`}>
                
                {/* Top Greeting Ribbon */}
                <div className="border-b border-zinc-150 py-3.5 px-6 text-left bg-gray-50/50">
                  <span className="text-xs text-brand-forest/60 font-semibold uppercase tracking-wider">
                    {timeGreeting}
                  </span>
                </div>
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
                {isProcessingDoc ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in duration-300">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-gray-100 border-t-brand-green animate-spin" />
                      <Brain className="w-6 h-6 text-brand-green animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-extrabold text-brand-forest text-sm sm:text-base">
                        Preparing your Study Workspace
                      </h3>
                      <p className="text-xs text-gray-400 font-medium max-w-sm leading-relaxed">
                        We are ingestion-mapping your document. This workspace will activate automatically.
                      </p>
                    </div>
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full shadow-2xs">
                      <div className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-forest">
                        {processingStage}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* NotebookLM Style Document Cover Card */}
                    {!hasChatted && (
                  <div className="bg-[#E9EEF6]/65 border border-zinc-200/50 rounded-3xl p-6 text-left relative overflow-hidden mb-6 group transition-all hover:bg-[#E9EEF6]/80">
                    {/* Floating light decorative circle */}
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-5">
                      {/* Orange Spark Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-2xs border border-zinc-150/30">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M11.5 2C11.5 2 12.3 8.3 12.3 8.3L19 9.5L12.3 10.7L11.5 17L10.7 10.7L4 9.5L10.7 8.3L11.5 2Z" />
                          <path d="M17.5 14C17.5 14 17.9 17.15 17.9 17.15L21.25 17.75L17.9 18.35L17.5 21.5L17.1 18.35L13.75 17.75L17.1 17.15L17.5 14Z" />
                        </svg>
                      </div>
                      
                      {/* Customize Button */}
                      <button
                        onClick={() => setShowRightPane(!showRightPane)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-zinc-200/60 text-[10px] font-bold text-gray-500 hover:text-brand-forest transition-all shadow-2xs cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="4" y1="21" x2="4" y2="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="4" y1="10" x2="4" y2="3" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="12" y1="21" x2="12" y2="12" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="12" y1="8" x2="12" y2="3" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="20" y1="21" x2="20" y2="16" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="20" y1="12" x2="20" y2="3" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="1" y1="14" x2="7" y2="14" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="9" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="2.5" />
                          <line x1="17" y1="16" x2="23" y2="16" stroke="currentColor" strokeWidth="2.5" />
                        </svg>
                        <span>Customize</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-extrabold text-lg sm:text-xl text-brand-forest tracking-tight leading-tight">
                        {docTitle}
                      </h2>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>1 source</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {docSummary && (
                        <p className="text-xs text-gray-500 font-normal leading-relaxed pt-3 border-t border-zinc-200/40 mt-3">
                          {docSummary}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Tour explainer card */}
                {!hasChatted && (
                  <div className="max-w-2xl bg-gray-50/80 border border-gray-100 rounded-3xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                    <h3 className="font-bold text-sm text-brand-forest">
                      Welcome to your Study Space
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                      This space is here to help you study and understand your notes. Click key concepts on the left to review them, chat with the AI tutor in the middle, and generate tests or save custom notes on the right panel.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
                          Left: Concepts
                        </span>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Click on key topics in the left sidebar to get explanations.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
                          Center: Chat
                        </span>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Ask questions, request analogies, and discuss notes interactively.
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green block">
                          Right: Studio & Notes
                        </span>
                        <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                          Generate practice quizzes, flashcard flip decks, and save notes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message Log */}
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}
                  >
                    {msg.role === 'system' ? (
                      <div className="bg-gray-50 text-[11px] font-bold tracking-wide uppercase text-gray-400 px-4 py-1.5 rounded-full border border-gray-100 text-center mx-auto select-none">
                        {msg.content}
                      </div>
                    ) : msg.role === 'user' ? (
                      <div className="max-w-[75%] rounded-2xl rounded-tr-none px-4 py-3 text-[14px] sm:text-[15px] font-medium leading-relaxed bg-[#E9EEF6] text-brand-forest shadow-3xs border border-[#E9EEF6]/10">
                        {msg.content.split('\n').map((line, idx) => (
                          <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full max-w-[95%] md:max-w-[90%] bg-white border border-gray-100 rounded-3xl p-6 md:p-8 text-left shadow-2xs transition-all">
                        {/* Identity Badge */}
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-150/45">
                          <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                            Braudle Tutor
                          </span>
                        </div>
                        
                        <MarkdownRenderer content={msg.content} />
                        
                        {index === 0 && (
                          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {[
                              { id: 'understand', label: 'Understand', icon: BookOpen },
                              { id: 'review', label: 'Review', icon: FileText },
                              { id: 'practice', label: 'Practice', icon: FileQuestion },
                              { id: 'prepare', label: 'Prepare', icon: Award },
                              { id: 'ask', label: 'Ask Anything', icon: Send },
                            ].map((m) => {
                              const IconComponent = m.icon;
                              return (
                                <button
                                  key={m.id}
                                  onClick={() => handleModeChange(m.id)}
                                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 ${
                                    activeMode === m.id
                                      ? 'bg-brand-green text-white border-brand-green'
                                      : 'bg-gray-50 hover:bg-gray-100 text-brand-forest border-gray-150'
                                  }`}
                                >
                                  <IconComponent className="w-3.5 h-3.5 shrink-0" />
                                  <span>{m.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Chunk Output parsed as Markdown */}
                {isStreaming && streamingContent && (
                  <div className="flex justify-start w-full">
                    <div className="w-full max-w-[95%] md:max-w-[90%] bg-white border border-gray-100 rounded-3xl p-6 md:p-8 text-left shadow-2xs">
                      {/* Identity Badge */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-150/45">
                        <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                          Braudle Tutor
                        </span>
                      </div>
                      
                      <MarkdownRenderer content={streamingContent} />
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isStreaming && !streamingContent && (
                  <div className="flex justify-start w-full">
                    <div className="w-full max-w-[95%] md:max-w-[90%] bg-white border border-gray-100 rounded-3xl p-6 md:p-8 text-left shadow-2xs">
                      {/* Identity Badge */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-150/45">
                        <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                        </div>
                        <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                          Braudle Tutor
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl w-fit">
                        <div className="flex gap-1.5 items-center">
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-xs text-brand-forest/60 font-semibold pl-1">Braudle Tutor is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="chat-end-ref" ref={chatEndRef} />
              </>
            )}
          </div>

              {/* Chat input box area */}
              <div className="border-t border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
                
                 {/* Floating suggestion pills */}
                 {!isStreaming && !isProcessingDoc && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-left">
                      {[
                        { id: 'analogy', label: '💡 Give an Analogy' },
                        { id: 'explain', label: '📖 Explain Core Idea' },
                        { id: 'practice', label: '✍️ Practice Quiz' },
                        { id: 'exam', label: '🎯 Exam Prep' },
                        { id: 'flashcards', label: '🎴 Flashcard Deck' }
                      ].map((pill) => (
                        <button
                          key={pill.id}
                          type="button"
                          onClick={() => {
                            if (pill.id === 'explain') {
                              setInput('Explain the core idea of this section in simple terms.');
                            } else if (pill.id === 'analogy') {
                              setInput('Give me a simple, real-world analogy to understand this.');
                            } else if (pill.id === 'practice') {
                              setIsExamSession(false);
                              setQuiz(null);
                              setQuizResult(null);
                              setRightPanelTab('quiz');
                              setActiveMobileTab('studio');
                              setShowRightPane(true);
                            } else if (pill.id === 'exam') {
                              setIsExamSession(true);
                              setQuiz(null);
                              setQuizResult(null);
                              setRightPanelTab('quiz');
                              setActiveMobileTab('studio');
                              setShowRightPane(true);
                            } else if (pill.id === 'flashcards') {
                              setRightPanelTab('flashcards');
                              setActiveMobileTab('studio');
                              setShowRightPane(true);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 bg-white hover:bg-zinc-50 hover:text-brand-forest transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Centered pill-shaped Prompt Input exactly like NotebookLM */}
                <form onSubmit={handleSendMessageWrapper} className={`relative flex items-center border rounded-full px-4 py-2 sm:px-5 sm:py-2.5 transition-all gap-3 shadow-2xs ${
                  isProcessingDoc 
                    ? 'bg-gray-100/50 border-gray-150 cursor-not-allowed opacity-60' 
                    : 'bg-gray-50 border-gray-200 focus-within:border-brand-green focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-green'
                }`}>
                  <input
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isProcessingDoc ? "Tutor is warming up..." : "Start typing..."}
                    className="flex-1 bg-transparent border-none text-base sm:text-xs text-brand-forest focus:outline-none placeholder-gray-400 font-medium py-1.5 disabled:cursor-not-allowed"
                    disabled={isStreaming || isProcessingDoc}
                  />
                  <div className="flex items-center gap-2.5 shrink-0 select-none">
                    <span className="bg-gray-100/80 text-[10px] text-gray-400 font-bold px-2.5 py-1 rounded-full border border-gray-200/50">
                      1 source
                    </span>
                    <button
                      id="chat-send-btn"
                      type="submit"
                      disabled={isStreaming || isProcessingDoc || !input.trim()}
                      className="w-8 h-8 rounded-full bg-brand-green text-white hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center active:scale-[0.98] shrink-0 disabled:cursor-not-allowed"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>

            </section>

            {/* PANEL 3: RIGHT PANEL (Studio / Study Modes & Notes) */}
            {(showRightPane || activeMobileTab === 'studio') && (
              <aside className={`bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-30 text-left transition-all duration-300 ease-in-out ${
                activeMobileTab === 'studio' 
                  ? 'flex flex-1 w-full' 
                  : `hidden lg:flex lg:relative ${
                      rightPanelTab === 'studio' 
                        ? 'lg:w-92' 
                        : isExpandedRightPane
                          ? 'lg:w-[70vw] xl:w-[65vw] max-w-5xl'
                          : 'lg:w-[48vw] xl:w-[50vw] max-w-3xl'
                    } animate-in slide-in-from-right-4 duration-300`
              }`}>
                
                {/* Header section with tab control */}
                <div className="pb-4 border-b border-zinc-100 mb-5 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {rightPanelTab !== 'studio' && (
                        <button
                          onClick={() => {
                            setRightPanelTab('studio');
                            setIsExpandedRightPane(false);
                          }}
                          className="p-1 rounded-xl text-zinc-500 hover:text-brand-forest hover:bg-zinc-50 transition-all cursor-pointer"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                          </svg>
                        </button>
                      )}
                      
                      <div className="text-left">
                        <span className="font-extrabold text-sm sm:text-base text-brand-forest block">
                          {rightPanelTab === 'studio' 
                            ? 'Braudle Modes' 
                            : rightPanelTab === 'quiz' 
                              ? (isExamSession ? 'Exam Simulation' : 'Physics Quiz') 
                              : 'Flashcard Deck'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {rightPanelTab !== 'studio' && (
                        <button
                          onClick={() => setIsExpandedRightPane(!isExpandedRightPane)}
                          className="p-1.5 rounded-xl border border-gray-100 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
                          title={isExpandedRightPane ? "Collapse Panel" : "Expand Panel"}
                        >
                          {isExpandedRightPane ? (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M4 14h6v6M20 10h-6V4" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button 
                        onClick={() => setShowRightPane(false)}
                        className="p-1.5 rounded-xl border border-gray-100 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* View 1 source pill under the title, matching NotebookLM exactly */}
                  {rightPanelTab !== 'studio' && (
                    <div className="mt-2.5 flex justify-start">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 text-[10px] font-bold text-gray-500 bg-white shadow-3xs">
                        <FileText className="w-3 h-3 text-zinc-400" />
                        <span>View 1 source</span>
                      </span>
                    </div>
                  )}
                </div>

                  {rightPanelTab === 'studio' && (
                    <div className="space-y-6 animate-in fade-in duration-200 flex-1 flex flex-col min-h-0">
                      
                      {/* Grid of study guides */}
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 mb-3">
                          Study Guide Generators
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-3">
                          {/* Card 1: Practice Quiz */}
                          <button
                            onClick={() => {
                              setIsExamSession(false);
                              setRightPanelTab('quiz');
                              setQuiz(null);
                              setQuizResult(null);
                            }}
                            disabled={isProcessingDoc}
                            className="p-4 rounded-2xl bg-[#E8F0FE] hover:bg-[#D2E3FC] text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[90px] border border-blue-150/20 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs animate-in fade-in"
                          >
                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center group-hover:scale-105 transition-all">
                              <FileQuestion className="w-4 h-4" />
                            </div>
                            <div className="flex items-center justify-between w-full mt-2">
                              <div>
                                <span className="font-extrabold text-xs text-brand-forest block">Practice Quiz</span>
                                <span className="text-[9px] text-gray-400 font-medium">Generate objective scenarios, subjective essays & mixed tests up to 20 Qs</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0" />
                            </div>
                          </button>

                          {/* Card 2: Exam Prep */}
                          <button
                            onClick={() => {
                              setIsExamSession(true);
                              setRightPanelTab('quiz');
                              setQuiz(null);
                              setQuizResult(null);
                            }}
                            disabled={isProcessingDoc}
                            className="p-4 rounded-2xl bg-[#FEF7E0] hover:bg-[#FADF9C] text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[90px] border border-amber-150/20 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs animate-in fade-in"
                          >
                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-all">
                              <Award className="w-4 h-4" />
                            </div>
                            <div className="flex items-center justify-between w-full mt-2">
                              <div>
                                <span className="font-extrabold text-xs text-brand-forest block">Exam Prep</span>
                                <span className="text-[9px] text-gray-400 font-medium">Build strict mock test simulations up to 15 Qs</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600 transition-colors shrink-0" />
                            </div>
                          </button>

                          {/* Card 3: Flashcards */}
                          <button
                            onClick={() => {
                              setRightPanelTab('flashcards');
                            }}
                            disabled={isProcessingDoc}
                            className="p-4 rounded-2xl bg-[#FCE8E6] hover:bg-[#FAD2CF] text-left transition-all cursor-pointer group flex flex-col justify-between min-h-[90px] border border-rose-150/20 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs animate-in fade-in"
                          >
                            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-all">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="flex items-center justify-between w-full mt-2">
                              <div>
                                <span className="font-extrabold text-xs text-brand-forest block">Flashcards Deck</span>
                                <span className="text-[9px] text-gray-400 font-medium">Generate active recall decks up to 15 cards</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-600 transition-colors shrink-0" />
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Saved Study Guides & Notes Section */}
                      <div className="border-t border-gray-150/40 pt-5 flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-3 shrink-0">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50">
                            Saved Study Guides & Notes
                          </h4>
                          <button
                            onClick={() => setIsAddNoteOpen(true)}
                            disabled={isProcessingDoc}
                            className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-[10px] font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            + Add Note
                          </button>
                        </div>

                        {combinedItems.length === 0 ? (
                          <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 flex-1 flex items-center justify-center animate-in fade-in">
                            <p className="text-[11px] leading-relaxed max-w-[200px]">
                              No guides or notes saved yet. Generate a quiz or write a note to get started!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
                            {combinedItems.map((item) => {
                              const isNote = item.type === 'note';
                              const isFlashcard = item.type === 'flashcards';
                              return (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    if (isNote) {
                                      setSelectedNote(item.raw);
                                    } else if (isFlashcard) {
                                      setRightPanelTab('flashcards');
                                    } else {
                                      handleLoadSavedQuiz(item.raw);
                                    }
                                  }}
                                  className="p-3 border border-gray-150 hover:border-brand-green rounded-xl bg-white cursor-pointer transition-all flex items-center justify-between group/saved-item shadow-2xs hover:scale-[1.01] animate-in fade-in"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                      isNote 
                                        ? 'bg-zinc-100 text-zinc-600' 
                                        : isFlashcard 
                                          ? 'bg-rose-100 text-rose-700' 
                                          : item.raw.isExam
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                      {isNote ? (
                                        <FileText className="w-4 h-4" />
                                      ) : isFlashcard ? (
                                        <BookOpen className="w-4 h-4" />
                                      ) : item.raw.isExam ? (
                                        <Award className="w-4 h-4" />
                                      ) : (
                                        <FileQuestion className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="text-left min-w-0">
                                      <span className="font-bold text-xs text-brand-forest block truncate group-hover/saved-item:text-brand-green transition-colors">
                                        {isNote ? item.title : (item.raw.isExam ? 'Exam Simulation' : 'Practice Test')}
                                      </span>
                                      <span className="text-[9px] text-gray-400 block mt-0.5">
                                        {isNote 
                                          ? `Custom Note · ${new Date(item.date).toLocaleDateString()}` 
                                          : isFlashcard
                                            ? `${item.subtitle} · Active`
                                            : `${item.subtitle} · ${new Date(item.date).toLocaleDateString()}`}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover/saved-item:text-brand-green transition-all" />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {rightPanelTab === 'quiz' && (
                    <div className="animate-in fade-in duration-200">
                      <PracticePanel 
                        quiz={quiz}
                        selectedAnswers={selectedAnswers}
                        setSelectedAnswers={setSelectedAnswers}
                        loadingQuiz={loadingQuiz}
                        submittingQuiz={submittingQuiz}
                        quizResult={quizResult}
                        onClose={() => setRightPanelTab('studio')}
                        onGenerateQuiz={handleGenerateQuiz}
                        onSubmitQuiz={handleQuizSubmit}
                        isEmbed={true}
                        isExam={isExamSession}
                        onGradeQuestion={handleGradeQuestion}
                        onExplainQuestion={handleExplainQuizQuestion}
                      />
                    </div>
                  )}

                  {rightPanelTab === 'flashcards' && (
                    <div className="space-y-5 animate-in fade-in duration-200 text-left">
                      {flashcards.length === 0 ? (
                        <div className="space-y-6 animate-in fade-in duration-200">
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-base text-brand-forest">
                              Setup Flashcards Deck
                            </h4>
                            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                              Configure how many cards to generate and specify any custom focus topics.
                            </p>
                          </div>

                          <div className="space-y-4">
                            {/* Flashcard Count */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                                  Flashcard Count
                                </label>
                                <span className="text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full">
                                  {flashcardCount} cards
                                </span>
                              </div>
                              <input
                                type="range"
                                min="5"
                                max="15"
                                step="5"
                                value={flashcardCount}
                                onChange={(e) => setFlashcardCount(Number(e.target.value))}
                                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-brand-green"
                              />
                              <div className="flex justify-between text-[8px] font-bold text-gray-400 px-1 uppercase tracking-wider">
                                <span>5 (Short)</span>
                                <span>10 (Standard)</span>
                                <span>15 (Max Deck)</span>
                              </div>
                            </div>

                            {/* Custom Focus Instructions */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                                Custom Focus / Instructions (Optional)
                              </label>
                              <input
                                type="text"
                                value={flashcardFocus}
                                onChange={(e) => setFlashcardFocus(e.target.value)}
                                placeholder="e.g. Focus on vocabulary or key dates..."
                                className="w-full p-3 border border-gray-150 rounded-xl bg-white text-xs font-medium text-brand-forest focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
                              />
                            </div>
                          </div>

                          <button
                            onClick={() => handleCreateCustomFlashcards(flashcardCount, flashcardFocus)}
                            disabled={isStreaming || isGeneratingFlashcards}
                            className="w-full py-3.5 bg-brand-green text-white rounded-2xl text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-95 shadow-2xs mt-4 flex items-center justify-center gap-1.5 disabled:opacity-40"
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>{isGeneratingFlashcards ? 'Configuring Deck...' : 'Generate Flashcards Deck'}</span>
                          </button>
                        </div>
                      ) : (
                        /* Interactive Flashcard deck */
                        <div className="space-y-5">
                          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <span className="truncate max-w-[150px]">Topic: {flashcards[currentFlashcardIdx]?.topic}</span>
                            <span>{currentFlashcardIdx + 1} of {flashcards.length}</span>
                          </div>

                          {/* Flip Card */}
                          <div 
                            onClick={() => setIsFlipped(!isFlipped)}
                            className={`w-full min-h-[200px] cursor-pointer rounded-3xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 relative select-none shadow-sm border active:scale-[0.98] ${
                              !isFlipped
                                ? 'bg-brand-forest text-white border-brand-yellow/20 hover:border-brand-yellow/45 hover:shadow-md'
                                : 'bg-[#FCFDF9] text-brand-forest border-zinc-200/60 hover:border-brand-green/30 hover:shadow-md'
                            }`}
                          >
                            {!isFlipped ? (
                              <div className="space-y-3 flex flex-col items-center">
                                <span className="text-[9px] font-black text-brand-yellow uppercase tracking-widest bg-brand-yellow/10 border border-brand-yellow/20 px-3 py-1 rounded-full">
                                  FRONT
                                </span>
                                <h4 className="font-extrabold text-sm sm:text-base leading-snug max-w-md">
                                  {flashcards[currentFlashcardIdx]?.front}
                                </h4>
                                <span className="text-[10px] text-gray-400 italic font-medium pt-2 block">
                                  Click card to reveal answer
                                </span>
                              </div>
                            ) : (
                              <div className="space-y-3 flex flex-col items-center">
                                <span className="text-[9px] font-black text-brand-green uppercase tracking-widest bg-brand-green/10 border border-brand-green/20 px-3 py-1 rounded-full">
                                  BACK
                                </span>
                                <p className="text-xs sm:text-sm text-brand-forest font-bold leading-relaxed max-w-md">
                                  {flashcards[currentFlashcardIdx]?.back}
                                </p>
                                <span className="text-[10px] text-brand-green/60 italic font-medium pt-2 block">
                                  Click card to see question
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Deck Nav buttons */}
                          <div className="flex gap-2">
                            <button
                              disabled={currentFlashcardIdx === 0}
                              onClick={() => {
                                setIsFlipped(false);
                                setCurrentFlashcardIdx(prev => Math.max(0, prev - 1));
                              }}
                              className="flex-1 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-brand-forest hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer disabled:opacity-40"
                            >
                              Prev
                            </button>
                            <button
                              disabled={currentFlashcardIdx === flashcards.length - 1}
                              onClick={() => {
                                setIsFlipped(false);
                                setCurrentFlashcardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                              }}
                              className="flex-1 py-3 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}


              </aside>
            )}

            {/* Mobile Practice test FAB */}
            {!showRightPane && (
              <button
                onClick={() => {
                  setShowRightPane(true);
                }}
                className="lg:hidden fixed bottom-24 right-6 p-4 rounded-full bg-brand-green text-white shadow-xl hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
                title="Practice questions"
              >
                <Award className="w-5 h-5" />
              </button>
            )}

          </div>
        </div>
      )}

        {/* ══════════════ MODALS ══════════════ */}

        {/* Add Note Modal */}
        {isAddNoteOpen && (
          <AddNoteModal
            onClose={() => setIsAddNoteOpen(false)}
            onSave={handleSaveNewNote}
          />
        )}

        {/* View/Edit Note Modal */}
        {selectedNote && (
          <EditNoteModal
            note={selectedNote}
            onClose={() => setSelectedNote(null)}
            onUpdate={handleUpdateNote}
            onDelete={handleDeleteNote}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}

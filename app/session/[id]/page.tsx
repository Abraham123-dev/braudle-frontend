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
  Brain
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

  // Consume modular session hook
  const {
    loading,
    error,
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
    selectedAnswers,
    setSelectedAnswers,
    loadingQuiz,
    submittingQuiz,
    quizResult,
    showRightPane,
    setShowRightPane,
    handleSendMessage,
    handleModeChange,
    handleGenerateQuiz,
    handleQuizSubmit,
    handleFinishSession,
    docSummary
  } = useSession(sessionId);

  // Local Notes State
  const [notes, setNotes] = React.useState<SavedNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<SavedNote | null>(null);

  // Tab State for Right Panel
  const [rightPanelTab, setRightPanelTab] = React.useState<'studio' | 'quiz' | 'flashcards'>('studio');

  const hasChatted = messages.some((msg) => msg.role === 'user');

  // Flashcards state
  const [flashcards, setFlashcards] = React.useState<FlashcardItem[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);

  // Clicked Concept state
  const [clickedConcept, setClickedConcept] = React.useState<string | null>(null);

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

  // Auto-scroll on new chat logs or stream segments
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setClickedConcept(topicName);
  };

  const handleAskTutorAboutConcept = (concept: string) => {
    setInput(`Explain the concept of ${concept} in detail.`);
    setClickedConcept(null);
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      sendBtn?.click();
    }, 150);
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
          <div className="flex-1 min-h-0 flex relative overflow-hidden p-3 sm:p-4 lg:p-5 pt-0 gap-4">
            
            {/* PANEL 1: LEFT SIDEBAR (Sources & Key Concepts) */}
            <LeftSidebar
              docTitle={docTitle}
              topics={topics}
              onConceptClick={handleConceptClick}
            />

            {/* PANEL 2: CENTER CANVAS (Tutor Chat Space) */}
            <section className="flex-1 flex flex-col bg-white border border-gray-200/80 shadow-xs rounded-3xl overflow-hidden">
              
              {/* Top Greeting Ribbon */}
              <div className="border-b border-gray-50 py-3 px-6 text-left bg-gray-50/50 flex justify-between items-center">
                <span className="text-xs text-brand-forest/60 font-semibold uppercase tracking-wider">
                  {timeGreeting}
                </span>
                
                {/* Mobile Studio toggle button */}
                <button
                  onClick={() => setShowRightPane(!showRightPane)}
                  className="lg:hidden px-3 py-1 border border-gray-200 text-[10px] font-bold rounded-lg text-brand-forest"
                >
                  {showRightPane ? 'Hide Studio' : 'Open Studio'}
                </button>
              </div>

              {/* Chat Canvas messages list */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                
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
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'system' ? (
                      <div className="bg-gray-50 text-[11px] font-bold tracking-wide uppercase text-gray-400 px-4 py-1.5 rounded-full border border-gray-100 text-center mx-auto select-none">
                        {msg.content}
                      </div>
                    ) : (
                      <div 
                        className={`max-w-[80%] rounded-3xl p-5 text-left leading-relaxed text-sm font-medium ${
                          msg.role === 'user'
                            ? 'bg-gray-100 text-brand-forest'
                            : 'bg-white border border-gray-50 text-brand-forest shadow-2xs'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content.split('\n').map((line, idx) => (
                            <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                              {line}
                            </p>
                          ))
                        ) : (
                          <>
                            <MarkdownRenderer content={msg.content} />
                            {index === 0 && (
                              <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Streaming Chunk Output parsed as Markdown */}
                {isStreaming && streamingContent && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-3xl p-5 text-left leading-relaxed text-sm font-medium bg-white border border-gray-50 text-brand-forest shadow-2xs animate-in fade-in duration-100">
                      <MarkdownRenderer content={streamingContent} />
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isStreaming && !streamingContent && (
                  <div className="flex justify-start items-center gap-2 p-4 bg-gray-50 rounded-2xl w-fit animate-pulse">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-green" />
                    <span className="text-xs text-gray-400 font-medium">Braudle Tutor is thinking...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Chat input box area */}
              <div className="border-t border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
                
                {/* Floating suggestion pills */}
                {!isStreaming && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-left">
                    {[
                      'Give me an analogy',
                      'Explain the core idea',
                      'Summarize this study section'
                    ].map((pill) => (
                      <button
                        key={pill}
                        onClick={() => setInput(pill)}
                        className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-bold text-gray-500 bg-white hover:bg-gray-50 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                )}

                {/* Centered pill-shaped Prompt Input exactly like NotebookLM */}
                <form onSubmit={handleSendMessage} className="relative flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 focus-within:border-brand-green focus-within:bg-white focus-within:ring-1 focus-within:ring-brand-green transition-all gap-3 shadow-2xs">
                  <input
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Start typing..."
                    className="flex-1 bg-transparent border-none text-base sm:text-xs text-brand-forest focus:outline-none placeholder-gray-400 font-medium py-1.5"
                    disabled={isStreaming}
                  />
                  <div className="flex items-center gap-2.5 shrink-0 select-none">
                    <span className="bg-gray-100/80 text-[10px] text-gray-400 font-bold px-2.5 py-1 rounded-full border border-gray-200/50">
                      1 source
                    </span>
                    <button
                      id="chat-send-btn"
                      type="submit"
                      disabled={isStreaming || !input.trim()}
                      className="w-8 h-8 rounded-full bg-brand-green text-white hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center active:scale-[0.98] shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>

            </section>

            {/* PANEL 3: RIGHT PANEL (Studio / Study Modes & Notes) */}
            {showRightPane && (
              <aside className="absolute inset-y-0 right-0 w-full lg:relative lg:w-92 bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 flex flex-col justify-between overflow-y-auto shrink-0 z-30 animate-in slide-in-from-right-4 duration-300 text-left">
                
                {/* Header section with tab control */}
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-gray-50 mb-6">
                    <span className="font-bold text-sm text-brand-forest capitalize">
                      {rightPanelTab === 'studio' ? 'Studio' : rightPanelTab === 'quiz' ? 'Practice Test' : 'Flashcards'}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      {rightPanelTab !== 'studio' && (
                        <button
                          onClick={() => setRightPanelTab('studio')}
                          className="px-2.5 py-1 rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
                        >
                          Back to Studio
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

                  {rightPanelTab === 'studio' && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      
                      {/* Grid of study guides */}
                      <div className="space-y-5">
                        {/* 1. Tutor Modes */}
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 mb-3">
                            Tutor Study Modes
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              { id: 'understand', label: 'Understand', desc: 'Receive explanations, simplified breakdowns & examples.', icon: BookOpen, color: 'emerald' },
                              { id: 'review', label: 'Review Recaps', desc: 'Get key point recaps and document summaries.', icon: FileText, color: 'indigo' },
                              { id: 'practice', label: 'Practice Inline', desc: 'Answer tutor questions inline with instant feedback.', icon: FileQuestion, color: 'teal' },
                              { id: 'prepare', label: 'Exam Prep Simulation', desc: 'Study for tests with simulated mock questions.', icon: Award, color: 'amber' },
                              { id: 'ask', label: 'Free Discussion', desc: 'Ask any free-form question about the material.', icon: Send, color: 'rose' }
                            ].map((modeItem) => {
                              const isActive = activeMode === modeItem.id;
                              const ModeIcon = modeItem.icon;
                              
                              let colorClasses = 'border-gray-150 bg-white hover:bg-gray-50/40';
                              if (isActive) {
                                if (modeItem.color === 'emerald') colorClasses = 'border-emerald-500 bg-emerald-50/10';
                                else if (modeItem.color === 'indigo') colorClasses = 'border-indigo-500 bg-indigo-50/10';
                                else if (modeItem.color === 'teal') colorClasses = 'border-teal-500 bg-teal-50/10';
                                else if (modeItem.color === 'amber') colorClasses = 'border-amber-500 bg-amber-50/10';
                                else if (modeItem.color === 'rose') colorClasses = 'border-rose-500 bg-rose-50/10';
                              }

                              return (
                                <button
                                  key={modeItem.id}
                                  onClick={() => handleModeChange(modeItem.id)}
                                  className={`p-3.5 border rounded-2xl text-left transition-all cursor-pointer group flex items-start gap-3 w-full relative ${colorClasses}`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    isActive 
                                      ? 'bg-brand-green text-white' 
                                      : 'bg-gray-100 text-gray-500 group-hover:scale-105 transition-transform'
                                  }`}>
                                    <ModeIcon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs text-brand-forest block">
                                        {modeItem.label}
                                      </span>
                                      {isActive && (
                                        <span className="text-[8px] font-bold text-brand-green uppercase tracking-wider bg-brand-green/10 px-1.5 py-0.5 rounded-full select-none">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-medium leading-relaxed block mt-0.5">
                                      {modeItem.desc}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Study Tools */}
                        <div className="border-t border-gray-50 pt-4">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 mb-3">
                            Study Guide Generators
                          </h4>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Quiz Trigger */}
                            <button
                              onClick={() => {
                                setRightPanelTab('quiz');
                                if (!quiz) handleGenerateQuiz();
                              }}
                              className="p-3.5 border border-gray-150 rounded-2xl bg-white hover:bg-gray-50/40 text-left transition-all cursor-pointer group flex flex-col gap-2"
                            >
                              <div className="w-8 h-8 rounded-xl bg-teal-100/50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-all">
                                <Award className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-brand-forest block">Practice Quiz</span>
                                <span className="text-[10px] text-gray-400 font-medium">Full adaptive test</span>
                              </div>
                            </button>

                            {/* Flashcards Trigger */}
                            <button
                              onClick={() => {
                                setRightPanelTab('flashcards');
                                if (flashcards.length === 0) {
                                  handleModeChange('flashcards');
                                }
                              }}
                              className="p-3.5 border border-gray-150 rounded-2xl bg-white hover:bg-gray-50/40 text-left transition-all cursor-pointer group flex flex-col gap-2"
                            >
                              <div className="w-8 h-8 rounded-xl bg-amber-100/50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-all">
                                <BookOpen className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="font-bold text-xs text-brand-forest block">Flashcards Deck</span>
                                <span className="text-[10px] text-gray-400 font-medium">Flip memory cards</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Saved Notes Section */}
                      <div className="border-t border-gray-50 pt-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50">
                            Saved Notes
                          </h4>
                          <button
                            onClick={() => setIsAddNoteOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-[10px] font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-95"
                          >
                            + Add Note
                          </button>
                        </div>

                        {notes.length === 0 ? (
                          <div className="p-6 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400">
                            <p className="text-[11px] leading-relaxed">No notes saved. Write down key points to keep them handy!</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                            {notes.map((note) => (
                              <div
                                key={note.id}
                                onClick={() => setSelectedNote(note)}
                                className="p-3 border border-gray-150 hover:border-brand-green rounded-xl bg-white cursor-pointer transition-all flex items-center justify-between group/note"
                              >
                                <div className="text-left min-w-0 pr-2">
                                  <span className="font-bold text-xs text-brand-forest block truncate group-hover/note:text-brand-green transition-colors">
                                    {note.title}
                                  </span>
                                  <span className="text-[9px] text-gray-400 block mt-0.5">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover/note:text-brand-green transition-all" />
                              </div>
                            ))}
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
                      />
                    </div>
                  )}

                  {rightPanelTab === 'flashcards' && (
                    <div className="space-y-5 animate-in fade-in duration-200 text-left">
                      {flashcards.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <p className="text-xs text-gray-400 font-medium max-w-[200px] leading-relaxed">
                            No flashcards generated yet. Click below to switch study mode and request concept flashcards.
                          </p>
                          <button
                            onClick={() => handleModeChange('flashcards')}
                            className="px-5 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer"
                          >
                            Generate Flashcards
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
                            className="w-full min-h-[160px] bg-amber-50/15 border border-amber-200/50 hover:border-amber-400/50 cursor-pointer rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 relative select-none"
                          >
                            {!isFlipped ? (
                              <div className="space-y-2">
                                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider bg-amber-100/50 px-2 py-0.5 rounded">FRONT</span>
                                <h4 className="font-bold text-xs text-brand-forest leading-snug">
                                  {flashcards[currentFlashcardIdx]?.front}
                                </h4>
                                <p className="text-[9px] text-gray-400 italic mt-2">Click card to flip</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <span className="text-[9px] font-bold text-teal-600 uppercase tracking-wider bg-teal-100/50 px-2 py-0.5 rounded">BACK</span>
                                <p className="text-xs text-brand-forest font-medium leading-relaxed">
                                  {flashcards[currentFlashcardIdx]?.back}
                                </p>
                                <p className="text-[9px] text-gray-400 italic mt-2">Click card to view question</p>
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
                              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-40"
                            >
                              Prev
                            </button>
                            <button
                              disabled={currentFlashcardIdx === flashcards.length - 1}
                              onClick={() => {
                                setIsFlipped(false);
                                setCurrentFlashcardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>

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
        )}

        {/* ══════════════ MODALS ══════════════ */}

        {/* Concept Explanation Popup Modal */}
        {clickedConcept && (
          <ConceptExplanationModal
            concept={clickedConcept}
            onAskTutor={handleAskTutorAboutConcept}
            onClose={() => setClickedConcept(null)}
          />
        )}

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

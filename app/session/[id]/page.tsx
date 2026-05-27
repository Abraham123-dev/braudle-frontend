'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore, ChatMessage, StudySession } from '@/lib/store';
import { auth } from '@/lib/auth';
import ChatBubble from '@/components/tutor/ChatBubble';
import TutorInput from '@/components/tutor/TutorInput';
import ProgressBar from '@/components/tutor/ProgressBar';
import { ArrowLeft, PlayCircle, Loader2, Sparkles, Sliders, GraduationCap } from 'lucide-react';

export default function ActiveSessionPage() {
  const router = useRouter();
  const params = useParams();
  const docId = params.id as string;
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const {
    activeSession,
    setActiveSession,
    addMessageToActiveSession,
    updateActiveSession,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [explainLevel, setExplainLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [tutorResponding, setTutorResponding] = useState(false);

  // Initialize mockup or fetch active session
  useEffect(() => {
    const loggedUser = auth.getCurrentUser();
    if (!loggedUser) {
      router.replace('/login');
      return;
    }

    setLoading(true);

    // Mock active session fetch
    setTimeout(() => {
      const mockSession: StudySession = {
        id: 'session-active-1',
        documentId: docId,
        documentTitle: 'Cell_Biology_Lecture_1.pdf',
        mode: 'teach',
        status: 'active',
        currentChunkIndex: 1,
        totalChunks: 10,
        messages: [
          {
            id: 'm-1',
            role: 'assistant',
            content: "Hello! I am BRAUDLE, your personal AI tutor. Today we will explore **Cell Biology Lecture 1**. Let's start with Section 1: The Structure of Mitochondria.\n\nImagine the mitochondrion as a power station inside a city. It takes in fuel (nutrients) and converts it into usable power (ATP). The outer membrane acts like the security fence, keeping everything secure, while the inner membrane folds into deep ridges called **cristae**, providing a massive workspace to produce energy.\n\nTo check our understanding before moving to the next section: *Why do you think the inner membrane folds into cristae instead of being a flat circle?*",
            timestamp: new Date(Date.now() - 600000).toISOString(),
            type: 'explanation',
          },
        ],
      };

      setActiveSession(mockSession);
      setExplainLevel(mockSession.mode === 'breakdown' ? 'beginner' : 'beginner');
      setLoading(false);
    }, 800);

    return () => setActiveSession(null);
  }, [docId, router, setActiveSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages]);

  const handleSendMessage = (content: string) => {
    if (!activeSession) return;

    // 1. Add student message
    const studentMsg: ChatMessage = {
      id: `m-student-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      type: 'answer',
    };
    addMessageToActiveSession(studentMsg);
    setTutorResponding(true);

    // 2. Simulate AI response streaming
    setTimeout(() => {
      const isCorrectAnswer = content.toLowerCase().includes('surface') || content.toLowerCase().includes('space') || content.toLowerCase().includes('area');
      
      let replyText = '';
      if (isCorrectAnswer) {
        replyText = "Excellent job! Yes, folding the membrane into cristae increases the **surface area** dramatically. This allows more enzymes to pack onto the membrane to produce ATP rapidly. \n\nLet's advance to Section 2: The Role of Ribosomes in protein manufacturing...";
        
        // Mock advancing chunk progress
        const nextIndex = Math.min(activeSession.currentChunkIndex + 1, activeSession.totalChunks);
        updateActiveSession({ currentChunkIndex: nextIndex });
      } else {
        replyText = "That's an interesting thought, but let's look closer. Think about a standard table. If you want to pack 100 books on it, you need space. Folding the surface is like folding a large blanket: it gives you *more surface area* in a compact space. \n\nLet's try again: *Does folding the inner membrane create more or less physical surface area to generate energy?*";
      }

      const tutorMsg: ChatMessage = {
        id: `m-tutor-${Date.now()}`,
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
        type: 'feedback',
      };
      
      addMessageToActiveSession(tutorMsg);
      setTutorResponding(false);
    }, 1500);
  };

  const handleTriggerBreakdown = () => {
    if (!activeSession) return;

    // Trigger Breakdown mode: append simplified concept message
    setTutorResponding(true);
    updateActiveSession({ mode: 'breakdown' });

    setTimeout(() => {
      const breakdownMsg: ChatMessage = {
        id: `m-breakdown-${Date.now()}`,
        role: 'assistant',
        content: "💡 **Break It Down Mode Engaged!**\nLet's simplify this completely. Forget the technical details for a moment. \n\nImagine a standard piece of paper. If it's flat, it takes up a certain amount of space on your table. But if you scrunch or fold it up accordion-style, you can fit that entire sheet of paper inside a tiny matchbox. \n\nThe mitochondrion does the exact same thing: it folds a giant sheet of membrane to stuff it inside a tiny cell. More membrane = more energy generators!\n\nDoes this picture make more sense now?",
        timestamp: new Date().toISOString(),
        type: 'explanation',
      };
      addMessageToActiveSession(breakdownMsg);
      setTutorResponding(false);
    }, 1000);
  };

  const handleLevelChange = (level: 'beginner' | 'intermediate' | 'advanced') => {
    setExplainLevel(level);
    // In real app, we would make a PATCH to change session onboarding level
  };

  const handleTriggerQuiz = () => {
    router.push(`/session/${docId}/quiz`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const isCompleted = !!(activeSession && activeSession.currentChunkIndex >= activeSession.totalChunks);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-black">
      {/* Session Header */}
      <header className="sticky top-0 bg-white border-b border-zinc-100 z-10 p-4 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1">
                  {activeSession?.documentTitle}
                </h3>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> Active study session
                </span>
              </div>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl dark:bg-zinc-900">
              {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    explainLevel === lvl
                      ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          {activeSession && (
            <ProgressBar
              current={activeSession.currentChunkIndex}
              total={activeSession.totalChunks}
            />
          )}
        </div>
      </header>

      {/* Chat scroll area */}
      <main className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto p-4 flex flex-col">
        <div className="flex-1">
          {activeSession?.messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
          {tutorResponding && (
            <div className="flex w-full my-4 justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-white text-zinc-900 border border-zinc-100 rounded-bl-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800 shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs text-zinc-400 font-medium animate-pulse">Tutor is typing...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Complete / Start Quiz Box if all chunks are read */}
        {isCompleted && (
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-100 rounded-3xl p-6 text-center my-6 max-w-2xl mx-auto dark:from-indigo-950/20 dark:to-indigo-900/10 dark:border-indigo-900/30">
            <Sparkles className="w-8 h-8 text-indigo-600 mx-auto mb-3 dark:text-indigo-400" />
            <h4 className="text-base font-bold text-zinc-900 mb-1 dark:text-zinc-50">
              All learning material covered!
            </h4>
            <p className="text-xs text-zinc-500 mb-4 max-w-md mx-auto dark:text-zinc-400">
              You've successfully completed the lessons. Let's start the adaptive quiz to check your final understanding and award XP!
            </p>
            <button
              onClick={handleTriggerQuiz}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 py-3 px-6 text-xs font-semibold text-white hover:bg-indigo-700 transition-all shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-800"
            >
              <PlayCircle className="w-4 h-4" /> Start Adaptive Quiz
            </button>
          </div>
        )}
      </main>

      {/* Input bar */}
      <TutorInput
        onSendMessage={handleSendMessage}
        onTriggerBreakdown={handleTriggerBreakdown}
        disabled={tutorResponding || isCompleted}
      />
    </div>
  );
}

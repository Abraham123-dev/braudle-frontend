'use client';

import React, { useRef, useEffect, use } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSession, ChatMessage } from '@/hooks/useSession';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import PracticePanel from '@/components/quiz/PracticePanel';
import MarkdownRenderer, { renderInlineContent } from '@/components/tutor/MarkdownRenderer';
import dynamic from 'next/dynamic';
const PDFWorkspace = dynamic(() => import('@/components/tutor/PDFWorkspace'), {
  ssr: false,
});
import { AddNoteModal, EditNoteModal } from '@/components/tutor/SessionNotesModals';
import StudioPanel from '@/components/tutor/StudioPanel';
import FlashcardsPanel from '@/components/tutor/FlashcardsPanel';
import SummaryPanel from '@/components/tutor/SummaryPanel';
import BraudleMap from '@/components/tutor/BraudleMap';
import SessionRail, { ActiveView, ActiveDrawer } from '@/components/tutor/SessionRail';
import LeftSidebar from '@/components/tutor/LeftSidebar';
import Logo from '@/components/Logo';
import SlideDrawer from '@/components/tutor/SlideDrawer';
import PDFAgentChat from '@/components/tutor/PDFAgentChat';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  AlertCircle,
  FileText,
  X,
  Brain,
  Sparkles,
  Lock,
  Zap,
  AlignJustify,
  Layers
} from 'lucide-react';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

function isAnswerMatch(selected: string, correct: string, options?: string[], optionIdx?: number): boolean {
  if (!selected || !correct) return false;
  
  const cleanSel = selected.trim();
  const cleanCorr = correct.trim();
  
  if (cleanSel.toLowerCase() === cleanCorr.toLowerCase()) {
    return true;
  }

  // Boolean/True-False grading
  if (cleanCorr.toLowerCase() === 'true' || cleanCorr.toLowerCase() === 'false') {
    if (cleanSel.toLowerCase() === 't' && cleanCorr.toLowerCase() === 'true') return true;
    if (cleanSel.toLowerCase() === 'f' && cleanCorr.toLowerCase() === 'false') return true;
    return false;
  }
  
  const parseOption = (text: string) => {
    const match = text.match(/^([A-D])\s*[\.\)\:-]/i);
    if (match) {
      return {
        letter: match[1].toLowerCase(),
        text: text.slice(match[0].length).trim().toLowerCase()
      };
    }
    return {
      letter: '',
      text: text.trim().toLowerCase()
    };
  };
  
  const selParsed = parseOption(cleanSel);
  const corrParsed = parseOption(cleanCorr);
  
  if (corrParsed.letter && selParsed.letter && corrParsed.letter === selParsed.letter) {
    return true;
  }
  
  if (/^[A-D]\.?$/i.test(cleanCorr)) {
    const correctLetter = cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (selParsed.letter === correctLetter) {
      return true;
    }
  }

  if (/^[A-D]\.?$/i.test(cleanSel)) {
    const selectedLetter = cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (corrParsed.letter === selectedLetter) {
      return true;
    }
  }

  // Match using options index if available
  if (options && options.length > 0) {
    const studentIdx = optionIdx !== undefined && optionIdx !== -1 ? optionIdx : options.findIndex(opt => opt.trim().toLowerCase() === cleanSel.toLowerCase());
    const correctIdx = options.findIndex(opt => opt.trim().toLowerCase() === cleanCorr.toLowerCase());

    const studentLetter = studentIdx !== -1 ? String.fromCharCode(97 + studentIdx) : null;
    const correctLetter = correctIdx !== -1 ? String.fromCharCode(97 + correctIdx) : null;

    const cleanCorrLetterOnly = cleanCorr.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (cleanCorrLetterOnly.length === 1 && studentLetter && cleanCorrLetterOnly === studentLetter) {
      return true;
    }

    const cleanSelLetterOnly = cleanSel.replace(/[\.\)\:-]/g, '').trim().toLowerCase();
    if (cleanSelLetterOnly.length === 1 && correctLetter && cleanSelLetterOnly === correctLetter) {
      return true;
    }

    if (studentLetter && correctLetter && studentLetter === correctLetter) {
      return true;
    }
  }
  
  const stripPrefix = (str: string) => str.replace(/^([A-D])\s*[\.\)\:-]\s*/i, '').trim().toLowerCase();
  if (stripPrefix(cleanSel) === stripPrefix(cleanCorr)) {
    return true;
  }
  
  return false;
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
    setMessages,
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
    quizWeakTopics,
    showRightPane,
    setShowRightPane,
    handleSendMessage,
    handleModeChange,
    handleGenerateQuiz,
    handleQuizSubmit,
    handleGradeQuestion,
    docSummary,
    sessionQuizzes,
    fetchSessionQuizzes,
    activeSuggestions,
    isTokenLimited,
    tokenResetTime,
    tokenLimitMessage,
    chatMessagesCount,
    explainMessagesCount,
    activeSessionError,
    setActiveSessionError,
    triggerTutorStream,
    triggerExplainStream,
    lastSentMessage,
    dueCount,
    handleRateConcept,
    documentId,
    knowledgeCacheStatus
  } = useSession(sessionId);

  const user = useStore((state) => state.user);
  const setPricingModalOpen = useStore((state) => state.setPricingModalOpen);
  // Local Notes State
  const [notes, setNotes] = React.useState<SavedNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<SavedNote | null>(null);

  // Local Inline Quiz State
  const [inlineQuizAnswers, setInlineQuizAnswers] = React.useState<Record<number, string>>({});

  // Local Quiz Preferences
  const [quizInitialInstructions, setQuizInitialInstructions] = React.useState('');
  const [quizInitialShowConfig, setQuizInitialShowConfig] = React.useState(false);

  // Tab State for Right Panel
  const [rightPanelTab, setRightPanelTab] = React.useState<'studio' | 'quiz' | 'flashcards' | 'summary'>('studio');
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = React.useState(false);

  // Key Concepts Panel Toggle State
  const [isConceptsOpen, setIsConceptsOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setIsConceptsOpen(true);
    }
  }, []);
  const [detailedSummary, setDetailedSummary] = React.useState('');
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [summaryError, setSummaryError] = React.useState('');

  const fetchDetailedSummary = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const res = await api.get<any>(`/sessions/${sessionId}/detailed-summary`);
      if (res.detailedSummary) {
        setDetailedSummary(res.detailedSummary);
      } else {
        throw new Error('Empty summary returned.');
      }
    } catch (err: any) {
      console.error('Failed to get summary:', err);
      setSummaryError(err.message || 'Failed to generate summary.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const [activeMobileTab, setActiveMobileTab] = React.useState<'sources' | 'chat' | 'studio'>('chat');
  const [centerTab, setCenterTab] = React.useState<'chat' | 'map' | 'pdf' | 'quiz' | 'flashcards' | 'summary' | 'concepts'>('chat');
  const [isPDFChatOpen, setIsPDFChatOpen] = React.useState(false);
  const [pdfChatMessages, setPdfChatMessages] = React.useState<ChatMessage[]>([]);
  const [pdfSelectionToExplain, setPdfSelectionToExplain] = React.useState<{ text: string; timestamp: number } | null>(null);
  const [pdfTargetPage, setPdfTargetPage] = React.useState<number | null>(null);
  const [pdfChatWidth, setPdfChatWidth] = React.useState(400);
  const [isResizing, setIsResizing] = React.useState(false);

  const startResizing = React.useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
    
    const handleMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = window.innerWidth - mouseMoveEvent.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setPdfChatWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  // New command-center nav state
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const [isFocusMode, setIsFocusMode] = React.useState(false);

  React.useEffect(() => {
    if (centerTab === 'summary' && !detailedSummary) {
      fetchDetailedSummary();
    }
  }, [centerTab]);

  // Derived: map rightPanelTab+showRightPane → activeDrawer
  const activeDrawer: ActiveDrawer = ['quiz', 'flashcards', 'concepts', 'summary'].includes(centerTab) ? (centerTab as ActiveDrawer) : null;
  const setActiveDrawer = (drawer: ActiveDrawer) => {
    if (drawer === null) {
      setCenterTab('chat');
    } else {
      setCenterTab(drawer);
    }
  };

  const handleViewChange = (view: ActiveView) => {
    setCenterTab(view);
    if (view === 'chat') setActiveMobileTab('chat');
    else if (view === 'pdf') setActiveMobileTab('chat');
    else if (view === 'map') setActiveMobileTab('chat');
    setIsMobileNavOpen(false);
  };

  const handleDrawerChange = (drawer: ActiveDrawer) => {
    if (drawer === null) {
      setCenterTab('chat');
    } else {
      setCenterTab(drawer);
      if (drawer === 'concepts') {
        setActiveMobileTab('studio');
      } else {
        setActiveMobileTab('studio');
      }
    }
    setIsMobileNavOpen(false);
  };

  // ────────────────────────────────────────────────────────────────────────────────────────
  const handleMapAskTutor = async (conceptName: string) => {
    setCenterTab('chat');
    setActiveMobileTab('chat');
    try {
      await handleModeChange('understand', true);
      await triggerTutorStream(`Initiate Socratic teaching session: Focus on the concept "${conceptName}". Teach me this concept using analogies and interactive questions, and check my understanding as we go.`);
    } catch (err: any) {
      console.error('Failed to initiate concept tutor:', err);
    }
  };

  const handleExplainSelection = async (selectedText: string) => {
    if (centerTab === 'pdf') {
      setIsPDFChatOpen(true);
      setPdfSelectionToExplain({ text: selectedText, timestamp: Date.now() });
      return;
    }
    setCenterTab('chat');
    setActiveMobileTab('chat');
    try {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: `Please explain this highlighted section: "${selectedText}"`, timestamp: new Date().toISOString() }
      ]);
      await triggerExplainStream(selectedText);
    } catch (err: any) {
      console.error('Failed to explain selection:', err);
    }
  };

  const handleMapStudyFlashcards = async (conceptName: string) => {
    setRightPanelTab('flashcards');
    setShowRightPane(true);
    setFlashcardFocus(conceptName);
    setIsGeneratingFlashcards(true);
    setFlashcardLimitError(null);
    try {
      const response = await api.post<{ status: string; flashcards: FlashcardItem[] }>(
        `/documents/${documentId}/concept-flashcards`,
        { conceptName, sessionId }
      );
      if (response && Array.isArray(response.flashcards)) {
        // Construct user and assistant messages representing this flashcard deck
        const userText = `Please generate exactly 10 flashcards from our study materials. Focus on the concept: "${conceptName}"`;
        const formattedLines = response.flashcards.map(fc => 
          `FLASHCARD | TOPIC: ${fc.topic} | FRONT: ${fc.front} | BACK: ${fc.back}`
        );
        formattedLines.push(`ðŸ’¡ These flashcards have been saved to your profile. Want to keep studying, try a practice question, or move to the next section?`);
        const assistantText = formattedLines.join('\n');

        const newMsgUser = {
          role: 'user' as const,
          content: userText,
          timestamp: new Date().toISOString()
        };
        const newMsgAssistant = {
          role: 'assistant' as const,
          content: assistantText,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMsgUser, newMsgAssistant]);
      }
    } catch (err: any) {
      console.error('Failed to generate concept flashcards:', err);
      if (err.message && (err.message.includes('limit') || err.message.includes('cooldown'))) {
        setFlashcardLimitError('Limit reached. Please retry tomorrow.');
      } else {
        alert(err.message || 'Failed to auto-create concept flashcards.');
      }
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleMapGenerateQuiz = async (conceptName: string, numQuestions: number = 5, difficulty: string = 'medium') => {
    setRightPanelTab('quiz');
    setShowRightPane(true);
    setIsExamSession(false);
    setQuiz(null);
    setQuizResult(null);
    setActiveMobileTab('studio');
    try {
      await handleGenerateQuiz('objective', numQuestions, `Focus on the concept: ${conceptName}`, false, difficulty, 0, 'instant', conceptName);
    } catch (err: any) {
      console.error('Failed to auto-generate concept quiz:', err);
    }
  };

  const handleExplainPage = async (pageNum: number, pageText: string) => {
    const prompt = `Please explain the key concepts on Page ${pageNum} of the document:\n\n"${pageText.slice(0, 3000)}"`;
    if (centerTab === 'pdf') {
      setIsPDFChatOpen(true);
      setPdfSelectionToExplain({ text: prompt, timestamp: Date.now() });
      return;
    }
    setMessages((prev: any) => [...prev, { role: 'user', content: prompt, timestamp: new Date().toISOString() }]);
    setCenterTab('chat');
    try {
      await triggerTutorStream(prompt);
    } catch (err) {
      console.error('Failed to trigger tutor stream:', err);
    }
  };

  const handleGenerateQuizPage = async (pageNum: number, pageText: string) => {
    setQuiz(null);
    setQuizResult(null);
    setQuizInitialInstructions(`Focus exclusively on Page ${pageNum} content. `);
    setQuizInitialShowConfig(true);
    setCenterTab('quiz');
    setActiveMobileTab('studio');
  };

  const handleGenerateFlashcardsPage = async (pageNum: number, pageText: string) => {
    const firstLine = pageText.split('\n')[0] || '';
    const cleanConceptName = `Page ${pageNum}: ${firstLine.slice(0, 80).trim()}`;
    await handleMapStudyFlashcards(cleanConceptName);
  };

  const [isExamSession, setIsExamSession] = React.useState(false);
  const [flashcardCount, setFlashcardCount] = React.useState(15);
  const [flashcardFocus, setFlashcardFocus] = React.useState('');
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = React.useState(false);
  const [flashcardLimitError, setFlashcardLimitError] = React.useState<string | null>(null);
  const [selectedFlashcardDeckId, setSelectedFlashcardDeckId] = React.useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const hasChatted = messages.some((msg) => msg.role === 'user');

  const [isExpandedRightPane, setIsExpandedRightPane] = React.useState(false);

  const handleExplainQuizQuestion = (question: any, studentAnswer: string, correctAnswer: string) => {
    const userMessage = `I am taking a quiz on this material and was given this question: "${question.question}"\n\nI chose this as the answer: "${studentAnswer}"\n\nThat answer was incorrect. The correct answer is "${correctAnswer}".\n\nHelp me understand why my answer was incorrect.`;
    setInput(userMessage);
    setCenterTab('chat');
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

  // Time ago helper for NotebookLM styling
  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  // Group and parse multiple flashcard decks dynamically from history
  const parsedFlashcardDecks = React.useMemo(() => {
    const decks: Array<{ id: string; date: string; cards: FlashcardItem[] }> = [];
    messages.forEach((msg, idx) => {
      if (msg.role === 'assistant') {
        const lines = msg.content.split('\n');
        const cards: FlashcardItem[] = [];
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
              cards.push({ topic: topic || 'General', front, back });
            }
          }
        });
        if (cards.length > 0) {
          decks.push({
            id: `deck-${idx}`,
            date: msg.timestamp || new Date().toISOString(),
            cards
          });
        }
      }
    });
    return decks;
  }, [messages]);

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
    
    // Add notes (each is independent)
    notes.forEach(note => {
      list.push({
        type: 'note',
        id: note.id,
        title: note.title,
        date: note.createdAt,
        raw: note
      });
    });
    
    // Group quizzes (q.isExam === false)
    const quizzes = sessionQuizzes.filter(q => !q.isExam);
    if (quizzes.length > 0) {
      quizzes.sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());
      list.push({
        type: 'quiz-group',
        id: 'group-quiz',
        title: `${docTitle} Quizzes`,
        subtitle: `1 source Â· ${quizzes.length} ${quizzes.length === 1 ? 'attempt' : 'attempts'}`,
        date: quizzes[0].submittedAt || quizzes[0].createdAt,
        items: quizzes.map((q, idx) => ({
          id: q._id,
          title: `Attempt ${quizzes.length - idx} (${q.totalQuestions} Questions)`,
          subtitle: `${q.score !== undefined ? `Scored ${q.score}%` : 'In Progress'}`,
          date: q.submittedAt || q.createdAt,
          raw: q
        }))
      });
    }

    // Group exams (q.isExam === true)
    const exams = sessionQuizzes.filter(q => q.isExam);
    if (exams.length > 0) {
      exams.sort((a, b) => new Date(b.submittedAt || b.createdAt).getTime() - new Date(a.submittedAt || a.createdAt).getTime());
      list.push({
        type: 'exam-group',
        id: 'group-exam',
        title: `${docTitle} Exams`,
        subtitle: `1 source Â· ${exams.length} ${exams.length === 1 ? 'attempt' : 'attempts'}`,
        date: exams[0].submittedAt || exams[0].createdAt,
        items: exams.map((q, idx) => ({
          id: q._id,
          title: `Attempt ${exams.length - idx} (${q.totalQuestions} Questions)`,
          subtitle: `${q.score !== undefined ? `Scored ${q.score}%` : 'In Progress'}`,
          date: q.submittedAt || q.createdAt,
          raw: q
        }))
      });
    }

    // Group flashcard decks
    if (parsedFlashcardDecks.length > 0) {
      const decks = [...parsedFlashcardDecks].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      list.push({
        type: 'flashcards-group',
        id: 'group-flashcards',
        title: `${docTitle} Flashcards`,
        subtitle: `1 source Â· ${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`,
        date: decks[0].date,
        items: decks.map((deck, idx) => ({
          id: deck.id,
          title: `Deck ${decks.length - idx} (${deck.cards.length} Cards)`,
          subtitle: `${formatTimeAgo(deck.date)}`,
          date: deck.date,
          raw: deck.cards
        }))
      });
    }
    
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [notes, sessionQuizzes, parsedFlashcardDecks, docTitle]);



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

  // Scan messages to extract flashcards dynamically and select latest by default
  useEffect(() => {
    if (selectedFlashcardDeckId === 'new') {
      setFlashcards([]);
    } else if (parsedFlashcardDecks.length > 0) {
      const activeDeck = parsedFlashcardDecks.find(d => d.id === selectedFlashcardDeckId) || parsedFlashcardDecks[parsedFlashcardDecks.length - 1];
      setFlashcards(activeDeck.cards);
    } else {
      setFlashcards([]);
    }
  }, [parsedFlashcardDecks, selectedFlashcardDeckId]);

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

  // Review Weak Topic from quiz results â€” switches to chat and auto-sends a focused tutoring request
  const handleReviewWeakTopic = (topicName: string) => {
    setRightPanelTab('studio');
    setShowRightPane(false);
    setCenterTab('chat');
    setActiveMobileTab('chat');
    const reviewMessage = `I just finished a quiz and I struggled with "${topicName}". Can you teach me this concept step by step, check my understanding with a question, and correct any misconceptions?`;
    setInput(reviewMessage);
    setTimeout(() => {
      const sendBtn = document.getElementById('chat-send-btn');
      sendBtn?.click();
    }, 200);
  };

  const handleCreateCustomFlashcards = async (count: number, focus: string) => {
    if (isStreaming) return;

    // Check limit
    const userPlan = user?.plan || 'free';
    const isPro = userPlan === 'plus' || userPlan === 'pro';
    const userId = user?.id || user?._id || 'guest';
    if (!isPro) {
      const lastGenTimeStr = localStorage.getItem(`braudle_last_generated_flashcards_${userId}`);
      if (lastGenTimeStr) {
        let timestamps: number[] = [];
        try {
          timestamps = JSON.parse(lastGenTimeStr);
          if (!Array.isArray(timestamps)) {
            timestamps = [Number(lastGenTimeStr)];
          }
        } catch {
          timestamps = [Number(lastGenTimeStr)];
        }

        const cooldown = 24 * 60 * 60 * 1000;
        timestamps = timestamps.filter(t => Date.now() - t < cooldown);

        const limit = userPlan === 'free' ? 1 : 5;
        if (timestamps.length >= limit) {
          const oldest = Math.min(...timestamps);
          const remainingMs = cooldown - (Date.now() - oldest);
          const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
          let remainingStr = '';
          if (remainingHours >= 24) {
            const days = Math.floor(remainingHours / 24);
            const hours = remainingHours % 24;
            remainingStr = `${days}d ${hours}h`;
          } else {
            remainingStr = `${remainingHours}h`;
          }
          setFlashcardLimitError(remainingStr);
          return;
        }
      }
    }

    setIsGeneratingFlashcards(true);
    try {
      await handleModeChange('flashcards', true);
      const userText = `Please generate exactly ${count} flashcards from our study materials.${
        focus.trim() ? ` Custom focus instructions: "${focus.trim()}"` : ''
      }`;
      setFlashcards([]);
      setCurrentFlashcardIdx(0);
      setIsFlipped(false);
      
      const lastGenTimeStr = localStorage.getItem(`braudle_last_generated_flashcards_${userId}`);
      let timestamps: number[] = [];
      if (lastGenTimeStr) {
        try {
          timestamps = JSON.parse(lastGenTimeStr);
          if (!Array.isArray(timestamps)) {
            timestamps = [Number(lastGenTimeStr)];
          }
        } catch {
          timestamps = [Number(lastGenTimeStr)];
        }
      }
      timestamps.push(Date.now());
      localStorage.setItem(`braudle_last_generated_flashcards_${userId}`, JSON.stringify(timestamps));

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
    
    // Check if the request is a tutoring/explanation request rather than a direct setup command
    const isTutorReviewOrExplain = 
      userText.includes('finished a quiz') || 
      userText.includes('taking a quiz') || 
      userText.includes('teach me') || 
      userText.includes('explain why') || 
      userText.includes('help me understand') || 
      userText.includes('explain the concept');

    if (!isTutorReviewOrExplain) {
      const isQuizReq = userText.includes('quiz') || userText.includes('practice question') || userText.includes('practice test') || userText.includes('test me');
      const isExamReq = /\b(?:mock\s+)?exams?\b/i.test(userText);
      const isFcReq = userText.includes('flashcard') || userText.includes('flash card');

      if (isQuizReq) {
        setIsExamSession(false);
        setQuiz(null);
        setQuizResult(null);
        setRightPanelTab('quiz');
        setActiveMobileTab('studio');
        setShowRightPane(true);
        setInput('');
        return;
      } else if (isExamReq) {
        setIsExamSession(true);
        setQuiz(null);
        setQuizResult(null);
        setRightPanelTab('quiz');
        setActiveMobileTab('studio');
        setShowRightPane(true);
        setInput('');
        return;
      } else if (isFcReq) {
        setRightPanelTab('flashcards');
        setActiveMobileTab('studio');
        setShowRightPane(true);
      }
    }

    handleSendMessage(e);
  };

  const drawerTitle = (): string => {
    if (rightPanelTab === 'quiz') return isExamSession ? 'Exam Simulation' : 'Practice Quiz';
    if (rightPanelTab === 'flashcards') return 'Flashcard Deck';
    if (rightPanelTab === 'summary') return 'Study Summary';
    return 'Study Tools';
  };

  return (
    <ProtectedRoute>
      <div className="fixed inset-0 text-brand-forest font-sans flex overflow-hidden selection:bg-brand-lime selection:text-brand-green">

        {/* ── MOBILE NAV BACKDROP ─────────────────────────────────────── */}
        <div
          className={`fixed inset-0 bg-brand-forest/40 backdrop-blur-3xs z-40 lg:hidden transition-all duration-300 ${
            isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />

        {/* ── SESSION RAIL (Desktop slim rail + Mobile slide-in) ── */}
        <SessionRail
          activeView={centerTab as ActiveView}
          activeDrawer={activeDrawer}
          onViewChange={handleViewChange}
          onDrawerChange={handleDrawerChange}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={() => setIsMobileNavOpen(false)}
          docTitle={docTitle}
          isFocusMode={isFocusMode}
          onFocusToggle={() => setIsFocusMode(f => !f)}
          isExamSession={isExamSession}
          onExamModeChange={(isExam) => setIsExamSession(isExam)}
        />

        {/* ── MAIN CONTENT AREA ───────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-white">

          {/* Unified persistent session header */}
          <header className="w-full bg-white px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between shrink-0 z-30">
            {/* Left side: View switcher on desktop, Hamburger on mobile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Mobile hamburger button */}
              <button
                onClick={() => setIsMobileNavOpen(true)}
                className="lg:hidden flex flex-col gap-1 items-start justify-center h-9 w-9 hover:bg-zinc-55 rounded-xl transition-all cursor-pointer shrink-0"
                aria-label="Open navigation"
              >
                <div className="h-0.5 w-5 bg-brand-forest rounded-full" />
                <div className="h-0.5 w-3.5 bg-brand-forest rounded-full" />
                <div className="h-0.5 w-5 bg-brand-forest rounded-full" />
              </button>

              {/* Desktop switcher pills */}
              {!isProcessingDoc && !loading && !error && (
                <div className="hidden lg:flex bg-zinc-55 border border-zinc-100 p-0.5 rounded-xl gap-0.5 shadow-2xs">
                  {[
                    { id: 'chat' as const, label: '💬 Chat' },
                    { id: 'pdf' as const, label: '📄 PDF' },
                    { id: 'map' as const, label: '🗺️ Map' },
                  ].map(tab => {
                    const isActive = centerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => { handleViewChange(tab.id); }}
                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-lg font-sans ${
                          isActive 
                            ? 'bg-brand-green text-white shadow-xs' 
                            : 'text-zinc-400 hover:text-brand-forest'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Center: Note Title (with branding hidden on mobile to maximize space) */}
            <div className="flex-grow flex flex-col items-center justify-center text-center min-w-0 px-2 select-none">
              <div className="hidden sm:flex items-center gap-1.5 justify-center leading-none">
                <Logo size={16} className="shrink-0" />
                <span className="font-extrabold text-[13px] text-brand-green tracking-tight font-sans">Braudle</span>
              </div>
              <h1 className="text-xs sm:text-[10px] font-extrabold sm:font-bold text-brand-forest sm:text-gray-400 truncate max-w-[140px] sm:max-w-[320px] font-sans mt-0.5 leading-none" title={docTitle}>
                {docTitle}
              </h1>
            </div>

            {/* Right side: Focus button, Concepts toggle, and Avatar */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 justify-end">
              {isFocusMode && (
                <button
                  onClick={() => setIsFocusMode(false)}
                  className="hidden lg:block px-3 py-1.5 text-[9px] font-black uppercase tracking-wider bg-brand-forest text-brand-lime rounded-lg cursor-pointer hover:bg-brand-green transition-all font-sans"
                >
                  Exit Focus
                </button>
              )}
              {/* Concepts Toggle Button */}
              {!isProcessingDoc && !loading && !error && (
                <button
                  onClick={() => setIsConceptsOpen(!isConceptsOpen)}
                  className={`p-1.5 sm:p-2.5 h-8 w-8 sm:w-auto rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans ${
                    isConceptsOpen
                      ? 'bg-brand-yellow/15 border-brand-yellow/35 text-brand-forest shadow-2xs'
                      : 'bg-white border-zinc-100 text-zinc-400 hover:text-brand-forest hover:bg-zinc-55'
                  }`}
                  title="Toggle Key Concepts & Sources"
                >
                  <Brain className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline text-[9px] font-black uppercase tracking-wider">Concepts</span>
                </button>
              )}
              {/* Profile avatar / image */}
              <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-green/10 border border-brand-green/20 text-brand-green flex items-center justify-center font-bold text-xs font-sans shrink-0 uppercase select-none">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  (() => {
                    if (!user) return 'U';
                    if (user.name) {
                      const parts = user.name.split(' ');
                      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                      return user.name.slice(0, 2).toUpperCase();
                    }
                    if (user.email) return user.email.slice(0, 2).toUpperCase();
                    return 'U';
                  })()
                )}
              </div>
            </div>
          </header>

          {/* â”€â”€ CENTER CANVAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-pulse">
              <div className="w-full max-w-xl space-y-4">
                <div className="h-48 bg-white/80 border border-zinc-200/50 rounded-3xl" />
                <div className="h-4 bg-white/80 rounded-full w-3/4" />
                <div className="h-4 bg-white/80 rounded-full w-1/2" />
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md w-full border border-gray-100 rounded-3xl p-8 space-y-6 bg-white">
                <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-brand-forest font-sans">{error}</p>
                <a href="/home" className="w-full block py-3 bg-brand-green text-white rounded-xl text-xs font-bold hover:bg-brand-green/90 transition-all text-center font-sans">
                  Return to Library
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">

              {/* Keep-alive center panels */}
              {/* TAB: Map */}
              <div className={`flex-1 flex flex-col min-h-0 w-full h-full ${centerTab === 'map' ? 'animate-in fade-in duration-200' : 'hidden'}`}>
                <BraudleMap
                  documentId={documentId}
                  onAskTutor={handleMapAskTutor}
                  onGenerateQuiz={handleMapGenerateQuiz}
                  onStudyFlashcards={handleMapStudyFlashcards}
                />
              </div>

              {/* TAB: PDF */}
              <div className={`flex-1 flex flex-row min-h-0 w-full h-full ${centerTab === 'pdf' ? 'animate-in fade-in duration-200' : 'hidden'}`}>
                <div className="flex-1 min-w-0 h-full relative">
                  <PDFWorkspace
                    documentId={documentId}
                    onExplainSelection={handleExplainSelection}
                    onExplainPage={handleExplainPage}
                    onGenerateQuizPage={handleGenerateQuizPage}
                    onGenerateFlashcardsPage={handleGenerateFlashcardsPage}
                    onClose={() => setCenterTab('chat')}
                    isActive={centerTab === 'pdf'}
                    isChatAgentOpen={isPDFChatOpen}
                    onToggleChatAgent={() => setIsPDFChatOpen(!isPDFChatOpen)}
                    targetPage={pdfTargetPage}
                    onClearTargetPage={() => setPdfTargetPage(null)}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {isPDFChatOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: pdfChatWidth, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={isResizing ? { duration: 0 } : { duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full shrink-0 z-10 py-3.5 pr-4 pl-1.5 flex flex-row overflow-hidden"
                      style={{ width: pdfChatWidth }}
                    >
                      {/* Interactive Floating Drag Handle */}
                      <div
                        onMouseDown={startResizing}
                        className="w-2.5 cursor-col-resize hover:bg-brand-green/10 active:bg-brand-green/20 transition-all shrink-0 z-20 flex items-center justify-center group relative h-[calc(100%-24px)] my-auto mr-2 rounded-full"
                        title="Drag to resize chat"
                      >
                        <div className="w-[2px] h-12 bg-zinc-200/80 group-hover:bg-brand-green/45 group-active:bg-brand-green/60 rounded-full transition-colors" />
                      </div>

                      <div className="flex-1 h-full flex flex-col min-w-0">
                        <PDFAgentChat
                          documentId={documentId}
                          sessionId={sessionId}
                          messages={pdfChatMessages}
                          setMessages={setPdfChatMessages}
                          docTitle={docTitle}
                          selectionToExplain={pdfSelectionToExplain}
                          onClearSelectionToExplain={() => setPdfSelectionToExplain(null)}
                          onScrollToPage={(pageNum) => setPdfTargetPage(pageNum)}
                          onClose={() => setIsPDFChatOpen(false)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* TAB: Chat */}
              <div className={`flex-1 flex flex-row min-h-0 w-full ${centerTab === 'chat' ? 'flex animate-in fade-in duration-200' : 'hidden'}`}>
                
                {/* Main Chat log & input wrapper */}
                <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden bg-white">
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                    <div className="max-w-2xl mx-auto w-full space-y-6">

                  {/* Document cover card */}
                  {!hasChatted && (
                    <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-6 text-left relative overflow-hidden mb-6 group transition-all hover:bg-zinc-100/60">
                      <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-2xs border border-zinc-200/30">
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M11.5 2C11.5 2 12.3 8.3 12.3 8.3L19 9.5L12.3 10.7L11.5 17L10.7 10.7L4 9.5L10.7 8.3L11.5 2Z" />
                            <path d="M17.5 14C17.5 14 17.9 17.15 17.9 17.15L21.25 17.75L17.9 18.35L17.5 21.5L17.1 18.35L13.75 17.75L17.1 17.15L17.5 14Z" />
                          </svg>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h2 className="font-extrabold text-lg sm:text-xl text-brand-forest tracking-tight leading-tight font-sans">{docTitle}</h2>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <span>1 source</span>
                          <span>•</span>
                          <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {docSummary && (
                          <p className="text-xs text-gray-500 font-normal leading-relaxed pt-3 border-t border-zinc-200/40 mt-3 font-sans">{docSummary}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Processing state */}
                  {isProcessingDoc && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6 animate-in fade-in duration-300">
                      <div className="relative w-20 h-20 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-zinc-100 border-t-brand-green animate-spin" />
                        <Logo size={42} className="animate-pulse object-contain" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-brand-forest text-sm sm:text-base font-sans">Preparing your Study Workspace</h3>
                        <p className="text-xs text-gray-400 font-medium max-w-sm leading-relaxed font-sans">We are ingestion-mapping your document. This workspace will activate automatically.</p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full shadow-2xs">
                        <div className="w-2 h-2 rounded-full bg-brand-green animate-ping" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-forest font-sans">{processingStage}</span>
                      </div>
                    </div>
                  )}

                  {/* Welcome card */}
                  {!hasChatted && !isProcessingDoc && (
                    <div className="max-w-2xl bg-gray-50/80 border border-gray-100 rounded-3xl p-6 text-left space-y-4 animate-in fade-in duration-300">
                      <h3 className="font-bold text-sm text-brand-forest font-sans">Welcome to your Study Space</h3>
                      <p className="text-xs text-gray-500 leading-relaxed font-normal font-sans">
                        Chat with the AI tutor, view your PDF, or explore the Concept Map — all accessible from the left rail.
                      </p>
                      {topics && topics.length > 0 && (
                        <div className="pt-4 border-t border-gray-200/50 space-y-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60 block font-sans">
                            Start with a key concept
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {topics.slice(0, 6).map((topic, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleConceptClick(topic)}
                                className="px-3.5 py-2 rounded-xl bg-brand-yellow/10 hover:bg-brand-yellow/20 border border-brand-yellow/20 hover:border-brand-yellow/30 text-xs font-bold text-brand-forest hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-3xs font-sans"
                              >
                                🔍 Explain {topic}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message log */}
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                      {msg.role === 'system' ? (
                        <div className="bg-gray-50 text-[11px] font-bold tracking-wide uppercase text-gray-400 px-4 py-1.5 rounded-full border border-gray-100 text-center mx-auto select-none font-sans">
                          {msg.content}
                        </div>
                      ) : msg.role === 'user' ? (
                        <div className="max-w-[75%] break-words rounded-3xl px-5 py-3.5 text-[14px] sm:text-[15px] font-medium leading-relaxed bg-zinc-100 text-brand-charcoal border border-zinc-200/40 shadow-2xs font-sans">
                          {msg.content.split('\n').map((line, idx) => (
                            <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full break-words overflow-hidden min-w-0 text-brand-forest py-2.5 text-sm text-left transition-all">
                          <MarkdownRenderer content={msg.content} />
                          {msg.inlineQuiz && (
                            <div className="mt-4 p-5 bg-[#F0F4F9]/60 border border-zinc-200/50 rounded-2xl space-y-4 max-w-xl animate-in fade-in duration-200">
                              <h4 className="font-bold text-xs text-brand-forest uppercase tracking-wider flex items-center gap-1.5 font-sans">
                                <Brain className="w-3.5 h-3.5 text-brand-green animate-pulse" />
                                <span>Concept Check-In</span>
                              </h4>
                              <p className="text-xs font-semibold text-brand-forest leading-relaxed font-sans">{msg.inlineQuiz.question}</p>
                              <div className="grid grid-cols-1 gap-2">
                                {msg.inlineQuiz!.options.map((option: string, optionIdx: number) => {
                                  const selected = inlineQuizAnswers[index] === option;
                                  const answered = inlineQuizAnswers[index] !== undefined;
                                  const isCorrect = isAnswerMatch(option, msg.inlineQuiz!.answer, msg.inlineQuiz!.options, optionIdx);
                                  let btnStyle = 'bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700';
                                  if (answered) {
                                    if (isCorrect) btnStyle = 'bg-green-50 border-green-500 text-green-700 font-bold';
                                    else if (selected) btnStyle = 'bg-rose-50 border-rose-500 text-rose-700 font-bold';
                                    else btnStyle = 'bg-white border-zinc-200 text-zinc-400 opacity-60';
                                  }
                                  return (
                                    <button
                                      key={option}
                                      type="button"
                                      disabled={answered}
                                      onClick={() => setInlineQuizAnswers(prev => ({ ...prev, [index]: option }))}
                                      className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between font-sans ${btnStyle}`}
                                    >
                                      <span>{option}</span>
                                      {answered && isCorrect && <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span>}
                                      {answered && selected && !isCorrect && <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">✗</span>}
                                    </button>
                                  );
                                })}
                              </div>
                              {inlineQuizAnswers[index] !== undefined && (
                                <div className="p-3.5 bg-white border border-zinc-200 rounded-xl space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200 text-left">
                                  {(() => {
                                    const selectedOption = inlineQuizAnswers[index];
                                    const selectedOptionIdx = msg.inlineQuiz!.options.indexOf(selectedOption);
                                    const isSelectedCorrect = isAnswerMatch(selectedOption, msg.inlineQuiz!.answer, msg.inlineQuiz!.options, selectedOptionIdx);
                                    return (
                                      <>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider font-sans ${isSelectedCorrect ? 'text-green-600' : 'text-rose-600'}`}>
                                          {isSelectedCorrect ? 'Correct!' : 'Incorrect'}
                                        </span>
                                        <p className="text-xs text-gray-500 leading-relaxed font-normal font-sans">{msg.inlineQuiz.explanation}</p>
                                      </>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming output */}
                  {isStreaming && streamingContent && (
                    <div className="flex justify-start w-full">
                      <div className="w-full text-brand-forest py-4 text-sm text-left">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200/45">
                          <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          </div>
                          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider font-sans">Braudle Tutor</span>
                        </div>
                        {streamingContent.trim().startsWith('{') ? (
                          <div className="flex items-center gap-2 p-3.5 bg-gray-50 border border-gray-150 rounded-2xl w-fit shadow-2xs">
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-brand-green animate-spin" />
                            <span className="text-xs text-brand-forest/65 font-bold font-sans">Structuring new study deck...</span>
                          </div>
                        ) : (
                          <MarkdownRenderer content={streamingContent} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Loading dots */}
                  {isStreaming && !streamingContent && (
                    <div className="flex justify-start w-full">
                      <div className="w-full text-brand-forest py-4 text-sm text-left">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200/45">
                          <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          </div>
                          <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider font-sans">Braudle Tutor</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50/50 border border-gray-100 rounded-2xl w-fit">
                          <div className="flex gap-1.5 items-center">
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce" />
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 rounded-full bg-brand-green animate-bounce [animation-delay:0.4s]" />
                          </div>
                          <span className="text-xs text-brand-forest/60 font-semibold pl-1 font-sans">Braudle Tutor is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                      <div className="chat-end-ref" ref={chatEndRef} />
                    </div> {/* Closes max-w-2xl messages wrapper */}
                  </div>

                {/* Input area */}
                {!isProcessingDoc && (
                  <div className="p-4 sm:pb-6 sm:pt-2 shrink-0 bg-white w-full max-w-full min-w-0 overflow-hidden">
                    <div className="max-w-2xl mx-auto w-full space-y-3.5">

                    {/* Suggestion pills */}
                    {!isStreaming && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full min-w-0">
                        {[
                          ...(activeSuggestions && activeSuggestions.length > 0
                            ? activeSuggestions.map((s, idx) => ({ id: `dyn-${idx}`, label: s }))
                            : topics && topics.length > 0
                              ? topics.slice(0, 3).map((t, idx) => ({ id: `concept-${idx}`, label: `ðŸ” Explain ${t}` }))
                              : []
                          ),
                          { id: 'analogy', label: 'ðŸ’¡ Give an Analogy' },
                          { id: 'explain', label: 'ðŸ“– Explain Core Idea' },
                          { id: 'practice', label: 'âœï¸ Practice Quiz' },
                          { id: 'exam', label: 'ðŸŽ¯ Exam Prep' },
                          { id: 'flashcards', label: 'ðŸŽ´ Flashcard Deck' },
                        ].map((pill) => (
                          <button
                            key={pill.id}
                            type="button"
                            onClick={() => {
                              if (pill.id.startsWith('dyn-')) {
                                setInput(pill.label);
                                setTimeout(() => document.getElementById('chat-send-btn')?.click(), 50);
                              } else if (pill.id.startsWith('concept-')) {
                                handleConceptClick(pill.label.replace(/^ðŸ” Explain /, ''));
                              } else if (pill.id === 'explain') {
                                setInput('Explain the core idea of this section in simple terms.');
                              } else if (pill.id === 'analogy') {
                                setInput('Give me a simple, real-world analogy to understand this.');
                              } else if (pill.id === 'practice') {
                                setIsExamSession(false); setQuiz(null); setQuizResult(null);
                                handleDrawerChange('quiz');
                              } else if (pill.id === 'exam') {
                                setIsExamSession(true); setQuiz(null); setQuizResult(null);
                                handleDrawerChange('quiz');
                              } else if (pill.id === 'flashcards') {
                                handleDrawerChange('flashcards');
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 bg-white hover:bg-zinc-50 hover:text-brand-forest transition-all cursor-pointer whitespace-nowrap active:scale-[0.98] font-sans"
                          >
                            {pill.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Error banner */}
                    {activeSessionError && (
                      <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70 p-4 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-bold text-rose-800 leading-snug font-sans">{activeSessionError.message}</p>
                            {activeSessionError.errorId && (
                              <span className="text-[9px] text-rose-600/70 font-semibold block mt-1 font-sans">Error ID: {activeSessionError.errorId}</span>
                            )}
                            <div className="flex gap-2.5 mt-3">
                              <button type="button" onClick={() => lastSentMessage && triggerTutorStream(lastSentMessage)} className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[10px] font-extrabold shadow-3xs cursor-pointer active:scale-[0.98] transition-all font-sans">Retry</button>
                              <button type="button" onClick={() => setActiveSessionError(null)} className="px-3.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-lg text-[10px] font-extrabold cursor-pointer active:scale-[0.98] transition-all font-sans">Dismiss</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Token limit lock */}
                    {isTokenLimited ? (
                      <div className="relative overflow-hidden rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-forest/5 via-brand-green/8 to-brand-lime/10 shadow-lg">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-green via-brand-lime to-brand-green" />
                        <div className="px-5 py-4 flex flex-col items-center gap-3 text-center">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-green to-brand-forest shadow-lg shadow-brand-green/20 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-brand-lime stroke-[2.5px]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-brand-forest leading-snug font-sans">
                              {tokenLimitMessage ? tokenLimitMessage : "You've reached your study limit"}
                            </p>
                            {!tokenLimitMessage && (
                              <p className="text-xs text-brand-forest/60 mt-0.5 leading-relaxed font-sans">
                                Your AI study time resets{tokenResetTime ? ` around ${tokenResetTime}` : ' soon'}.
                              </p>
                            )}
                          </div>
                          <div className="w-full flex items-center gap-3 bg-white/50 border border-brand-green/20 rounded-full px-4 py-2.5 cursor-not-allowed opacity-70">
                            <Lock className="w-3.5 h-3.5 text-brand-green/50 shrink-0" />
                            <span className="flex-1 text-xs text-brand-forest/40 font-medium text-left font-sans">
                              {tokenLimitMessage ? "Chat is locked for this document" : "Chat is locked until your limit resets..."}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPricingModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-green text-brand-lime text-xs font-bold shadow-md shadow-brand-green/20 hover:bg-brand-forest hover:scale-[1.02] transition-all active:scale-[0.98] cursor-pointer font-sans"
                          >
                            <Zap className="w-3.5 h-3.5 fill-brand-lime" />
                            Upgrade for more study time
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {user?.plan !== 'pro' && (
                          <div className="flex justify-between items-center mb-1.5 px-2">
                            <span className="text-[9px] font-black tracking-wider text-brand-green uppercase font-sans">
                              Active Document Chat
                            </span>
                            <span className="text-[9px] font-black tracking-wide text-zinc-400 uppercase font-sans bg-zinc-100 px-2 py-0.5 rounded-full">
                              {chatMessagesCount}/{user?.plan === 'plus' ? 60 : 20} messages
                            </span>
                          </div>
                        )}
                        {/* Chat input form */}
                        <form onSubmit={handleSendMessageWrapper} className={`relative flex items-center rounded-[24px] px-3.5 py-1.5 transition-all gap-3 shadow-2xs border ${isProcessingDoc ? 'bg-zinc-50 border-zinc-150 cursor-not-allowed opacity-60' : 'bg-zinc-55 border-zinc-200/80 focus-within:bg-white focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green/20'}`}>
                          {/* Attachment Indicator on Left */}
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-zinc-200/60 text-zinc-500 text-[10px] font-extrabold select-none cursor-default shrink-0 font-sans shadow-3xs">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            <span>(1)</span>
                          </div>
                          
                          <input
                            id="main-chat-input"
                            type="text"
                            required
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isProcessingDoc ? 'Tutor is warming up...' : 'Ask anything about your notes...'}
                            className="flex-1 w-full min-w-0 bg-transparent border-none text-sm text-brand-forest focus:outline-none placeholder-zinc-400 font-semibold py-1.5 disabled:cursor-not-allowed font-sans"
                            disabled={isStreaming || isProcessingDoc}
                          />
                          
                          <button
                            id="chat-send-btn"
                            type="submit"
                            disabled={isStreaming || isProcessingDoc || !input.trim()}
                            className={`w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                              !input.trim() || isStreaming || isProcessingDoc
                                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-70'
                                : 'bg-brand-green text-white hover:bg-brand-green/90 active:scale-95 cursor-pointer shadow-xs'
                            }`}
                          >
                            <ArrowRight className="w-4 h-4 stroke-[2.5px]" />
                          </button>
                        </form>
                        <p className="text-[9px] text-gray-400 font-bold text-center leading-none select-none font-sans">
                          Braudle can be inaccurate; please double check its responses.
                        </p>
                      </>
                    )}
                    </div>
                  </div>
                )}
                </div>

                {/* Desktop concepts drawer */}
                <div 
                  className="hidden lg:block transition-all duration-300 ease-in-out border-l border-zinc-100 bg-white overflow-hidden shrink-0"
                  style={{
                    width: isConceptsOpen ? '256px' : '0px',
                    opacity: isConceptsOpen ? 1 : 0,
                    borderLeftWidth: isConceptsOpen ? '1px' : '0px',
                  }}
                >
                  <LeftSidebar
                    docTitle={docTitle}
                    topics={topics}
                    onConceptClick={handleConceptClick}
                    className="w-64 h-full p-5 flex flex-col justify-between overflow-y-auto select-none text-left"
                  />
                </div>

                {/* Mobile concepts drawer backdrop */}
                <div 
                  onClick={() => setIsConceptsOpen(false)}
                  className={`lg:hidden fixed inset-0 bg-black/25 backdrop-blur-3xs z-40 transition-all duration-300 ${
                    isConceptsOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
                />
                
                {/* Mobile concepts drawer panel */}
                <div 
                  className={`lg:hidden fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isConceptsOpen ? 'translate-x-0' : 'translate-x-full'
                  }`}
                >
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100 shrink-0">
                    <span className="text-xs font-black uppercase tracking-wider text-brand-forest font-sans">Workspace Details</span>
                    <button 
                      onClick={() => setIsConceptsOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-brand-forest hover:bg-zinc-55 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0 bg-white">
                    <LeftSidebar
                      docTitle={docTitle}
                      topics={topics}
                      onConceptClick={(concept) => {
                        handleConceptClick(concept);
                        setIsConceptsOpen(false);
                      }}
                      className="w-full p-5 flex flex-col justify-between select-none text-left"
                    />
                  </div>
                </div>
              </div> {/* Closes TAB: Chat flex-row container */}

              {/* TAB: Quiz */}
              <div className={`flex-grow flex flex-col min-h-0 w-full h-full bg-white ${centerTab === 'quiz' ? 'flex animate-in fade-in duration-200' : 'hidden'}`}>
                <div className="flex-grow flex flex-col min-h-0 bg-white py-4 sm:py-6 h-full">
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-full flex flex-col justify-between min-h-0">
                    <PracticePanel
                      quiz={quiz}
                      selectedAnswers={selectedAnswers}
                      setSelectedAnswers={setSelectedAnswers}
                      loadingQuiz={loadingQuiz}
                      submittingQuiz={submittingQuiz}
                      quizResult={quizResult}
                      quizWeakTopics={quizWeakTopics}
                      onClose={() => setCenterTab('chat')}
                      onGenerateQuiz={handleGenerateQuiz}
                      onSubmitQuiz={handleQuizSubmit}
                      isEmbed={true}
                      isExam={isExamSession}
                      onGradeQuestion={handleGradeQuestion}
                      onExplainQuestion={handleExplainQuizQuestion}
                      onReviewWeakTopic={handleReviewWeakTopic}
                      topics={topics}
                      onSwitchTab={(tab) => { setCenterTab(tab); setIsMobileNavOpen(false); }}
                      onExamModeChange={(isExam) => setIsExamSession(isExam)}
                      setQuiz={setQuiz}
                      sessionQuizzes={sessionQuizzes}
                      docTitle={docTitle}
                      onLoadSavedQuiz={handleLoadSavedQuiz}
                      initialInstructions={quizInitialInstructions}
                      initialShowConfig={quizInitialShowConfig}
                    />
                  </div>
                </div>
              </div>

              {/* TAB: Flashcards */}
              <div className={`flex-grow flex flex-col min-h-0 w-full h-full bg-white ${centerTab === 'flashcards' ? 'flex animate-in fade-in duration-200' : 'hidden'}`}>
                <div className="flex-grow flex flex-col min-h-0 bg-white py-4 sm:py-6 h-full">
                  <div className="max-w-xl mx-auto w-full px-4 sm:px-6 h-full flex flex-col min-h-0">
                    <FlashcardsPanel
                      flashcards={flashcards}
                      flashcardCount={flashcardCount}
                      setFlashcardCount={setFlashcardCount}
                      flashcardFocus={flashcardFocus}
                      setFlashcardFocus={setFlashcardFocus}
                      flashcardLimitError={flashcardLimitError}
                      isStreaming={isStreaming}
                      isGeneratingFlashcards={isGeneratingFlashcards}
                      handleCreateCustomFlashcards={handleCreateCustomFlashcards}
                      currentFlashcardIdx={currentFlashcardIdx}
                      setCurrentFlashcardIdx={setCurrentFlashcardIdx}
                      isFlipped={isFlipped}
                      setIsFlipped={setIsFlipped}
                      onRateCard={handleRateConcept}
                      onCreateNewDeck={() => setSelectedFlashcardDeckId('new')}
                      parsedFlashcardDecks={parsedFlashcardDecks}
                      selectedFlashcardDeckId={selectedFlashcardDeckId}
                      onSelectDeck={setSelectedFlashcardDeckId}
                      docTitle={docTitle}
                    />
                  </div>
                </div>
              </div>

              {/* TAB: Summary */}
              <div className={`flex-grow flex flex-col min-h-0 w-full h-full bg-white ${centerTab === 'summary' ? 'flex animate-in fade-in duration-200' : 'hidden'}`}>
                <div className="flex-grow flex flex-col min-h-0 bg-white py-4 sm:py-6 h-full">
                  <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-full flex flex-col min-h-0">
                    <SummaryPanel
                      loadingSummary={loadingSummary}
                      summaryError={summaryError}
                      detailedSummary={detailedSummary}
                      docTitle={docTitle}
                      fetchDetailedSummary={fetchDetailedSummary}
                    />
                  </div>
                </div>
              </div>

              {/* TAB: Concepts */}
              <div className={`flex-grow flex flex-col min-h-0 w-full h-full bg-white ${centerTab === 'concepts' ? 'flex animate-in fade-in duration-200' : 'hidden'}`}>
                <div className="flex-grow flex flex-col min-h-0 bg-white py-4 sm:py-6 h-full">
                  <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 h-full flex flex-col min-h-0">
                    <StudioPanel
                      isProcessingDoc={isProcessingDoc}
                      combinedItems={combinedItems}
                      expandedGroups={expandedGroups}
                      toggleGroup={toggleGroup}
                      setSelectedNote={setSelectedNote}
                      handleLoadSavedQuiz={handleLoadSavedQuiz}
                      setSelectedFlashcardDeckId={setSelectedFlashcardDeckId}
                      setCurrentFlashcardIdx={setCurrentFlashcardIdx}
                      setIsFlipped={setIsFlipped}
                      setRightPanelTab={setRightPanelTab}
                      setActiveMobileTab={setActiveMobileTab}
                      setShowRightPane={setShowRightPane}
                      setIsAddNoteOpen={setIsAddNoteOpen}
                      setIsExamSession={setIsExamSession}
                      setQuiz={setQuiz}
                      setQuizResult={setQuizResult}
                      dueCount={dueCount}
                      knowledgeCacheStatus={knowledgeCacheStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>{/* end main content area */}

        {/* â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        {isAddNoteOpen && (
          <AddNoteModal onClose={() => setIsAddNoteOpen(false)} onSave={handleSaveNewNote} />
        )}
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

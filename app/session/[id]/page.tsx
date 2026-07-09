'use client';

import React, { useRef, useEffect, use } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useSession } from '@/hooks/useSession';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import PracticePanel from '@/components/quiz/PracticePanel';
import MarkdownRenderer, { renderInlineContent } from '@/components/tutor/MarkdownRenderer';
import LeftSidebar from '@/components/tutor/LeftSidebar';
import ConceptExplanationModal from '@/components/tutor/ConceptExplanationModal';
import { AddNoteModal, EditNoteModal } from '@/components/tutor/SessionNotesModals';
import StudioPanel from '@/components/tutor/StudioPanel';
import FlashcardsPanel from '@/components/tutor/FlashcardsPanel';
import SummaryPanel from '@/components/tutor/SummaryPanel';
import BraudleMap from '@/components/tutor/BraudleMap';
import { 
  BookOpen, 
  Award, 
  ArrowLeft, 
  ArrowRight,
  Send, 
  AlertCircle,
  FileText,
  ChevronRight,
  FileQuestion,
  Trash2,
  MoreVertical,
  X,
  Brain,
  Sparkles,
  Headphones,
  Presentation,
  Video,
  GitBranch,
  FileBarChart,
  Table,
  Lock,
  Zap
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
    activeSessionError,
    setActiveSessionError,
    triggerTutorStream,
    lastSentMessage,
    dueCount,
    handleRateConcept,
    documentId,
    knowledgeCacheStatus
  } = useSession(sessionId);

  const user = useStore((state) => state.user);
  // Local Notes State
  const [notes, setNotes] = React.useState<SavedNote[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = React.useState(false);
  const [selectedNote, setSelectedNote] = React.useState<SavedNote | null>(null);

  // Local Inline Quiz State
  const [inlineQuizAnswers, setInlineQuizAnswers] = React.useState<Record<number, string>>({});

  // Tab State for Right Panel
  const [rightPanelTab, setRightPanelTab] = React.useState<'studio' | 'quiz' | 'flashcards' | 'summary'>('studio');
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

  React.useEffect(() => {
    if (rightPanelTab === 'summary' && !detailedSummary) {
      fetchDetailedSummary();
    }
  }, [rightPanelTab]);

  const [activeMobileTab, setActiveMobileTab] = React.useState<'sources' | 'chat' | 'studio'>('chat');
  const [centerTab, setCenterTab] = React.useState<'chat' | 'map'>('chat');

  // ── Braudle Map Handlers ──────────────────────────────────────────────────
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
        formattedLines.push(`💡 These flashcards have been saved to your profile. Want to keep studying, try a practice question, or move to the next section?`);
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
    try {
      await handleGenerateQuiz('objective', numQuestions, `Focus on the concept: ${conceptName}`, false, difficulty, 0, 'instant', conceptName);
    } catch (err: any) {
      console.error('Failed to auto-generate concept quiz:', err);
    }
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
        subtitle: `1 source · ${quizzes.length} ${quizzes.length === 1 ? 'attempt' : 'attempts'}`,
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
        subtitle: `1 source · ${exams.length} ${exams.length === 1 ? 'attempt' : 'attempts'}`,
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
        subtitle: `1 source · ${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`,
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
    if (parsedFlashcardDecks.length > 0) {
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

  // Review Weak Topic from quiz results — switches to chat and auto-sends a focused tutoring request
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

        if (timestamps.length >= 3) {
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

            </div>

          </div>
        </header>

        {loading ? (
          /* Skeleton Workspace Layout */
          <div className="flex-1 flex flex-col lg:flex-row bg-[#EEF2F6] lg:p-4 lg:gap-4 overflow-hidden animate-pulse select-none">
            {/* Left Sidebar Skeleton */}
            <aside className="hidden lg:flex w-72 bg-white p-6 flex-col justify-between shrink-0 rounded-3xl border border-gray-200/50 shadow-2xs">
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
            <section className="flex-1 flex flex-col bg-white overflow-hidden rounded-3xl border border-gray-200/50 shadow-2xs">
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
                  ? 'flex flex-1 w-full bg-white p-6 flex-col justify-between overflow-y-auto shrink-0 select-none text-left animate-in fade-in duration-200' 
                  : `${isExpandedRightPane ? 'lg:hidden' : 'hidden lg:flex'} w-64 bg-white p-6 flex-col justify-between overflow-y-auto shrink-0 select-none text-left lg:rounded-3xl lg:border lg:border-zinc-200/50 lg:shadow-2xs`}
              />

              {/* PANEL 2: CENTER CANVAS (Tutor Chat Space) */}
              <section className={`flex-1 flex flex-col bg-white overflow-hidden lg:rounded-3xl lg:border lg:border-zinc-200/50 lg:shadow-2xs ${
                isExpandedRightPane
                  ? 'hidden'
                  : activeMobileTab === 'chat' 
                    ? 'flex flex-1 w-full' 
                    : 'hidden lg:flex'
              }`}>
                
                {/* Top Greeting Ribbon & Segmented Workspace Toggle */}
                <div className="border-b border-zinc-200/60 py-3 px-6 flex items-center justify-between bg-gray-50/50 select-none shrink-0">
                  <span className="text-xs text-brand-forest/60 font-semibold uppercase tracking-wider">
                    {timeGreeting}
                  </span>
                  
                  {!isProcessingDoc && (
                    <div className="flex bg-[#E2E6DD]/40 border border-zinc-200/40 p-0.5 rounded-xl gap-0.5 shadow-3xs">
                      <button
                        onClick={() => setCenterTab('chat')}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-lg ${
                          centerTab === 'chat'
                            ? 'bg-white text-brand-forest shadow-3xs'
                            : 'text-gray-400 hover:text-brand-forest'
                        }`}
                      >
                        💬 Chat
                      </button>
                      <button
                        onClick={() => setCenterTab('map')}
                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer rounded-lg ${
                          centerTab === 'map'
                            ? 'bg-white text-brand-forest shadow-3xs'
                            : 'text-gray-400 hover:text-brand-forest'
                        }`}
                      >
                        🗺️ Map
                      </button>
                    </div>
                  )}
                </div>
              {isProcessingDoc ? (
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
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
                </div>
              ) : centerTab === 'map' ? (
                <BraudleMap
                  documentId={documentId}
                  onAskTutor={handleMapAskTutor}
                  onGenerateQuiz={handleMapGenerateQuiz}
                  onStudyFlashcards={handleMapStudyFlashcards}
                />
              ) : (
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                    {/* NotebookLM Style Document Cover Card */}
                    {!hasChatted && (
                  <div className="bg-[#E9EEF6]/65 border border-zinc-200/50 rounded-3xl p-6 text-left relative overflow-hidden mb-6 group transition-all hover:bg-[#E9EEF6]/80">
                    {/* Floating light decorative circle */}
                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/20 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between mb-5">
                      {/* Orange Spark Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-white text-amber-500 flex items-center justify-center shadow-2xs border border-zinc-200/30">
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

                    {topics && topics.length > 0 && (
                      <div className="pt-5 border-t border-gray-200/50 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60 block">
                          Suggested: Ask about a key concept from your notes
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {topics.slice(0, 6).map((topic, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleConceptClick(topic)}
                              className="px-3.5 py-2 rounded-xl bg-brand-yellow/10 hover:bg-brand-yellow/20 border border-brand-yellow/20 hover:border-brand-yellow/30 text-xs font-bold text-brand-forest hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer shadow-3xs"
                            >
                              🔍 Explain {topic}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
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
                      <div className="max-w-[75%] rounded-3xl px-5 py-3.5 text-[14px] sm:text-[15px] font-medium leading-relaxed bg-[#E9EEF6] text-brand-forest shadow-2xs border border-[#E9EEF6]/5">
                        {msg.content.split('\n').map((line, idx) => (
                          <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
                            {line}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full text-brand-forest py-2.5 text-sm text-left transition-all">
                        <MarkdownRenderer content={msg.content} />

                        {msg.inlineQuiz && (
                          <div className="mt-4 p-5 bg-[#F0F4F9]/60 border border-zinc-200/50 rounded-2xl space-y-4 max-w-xl animate-in fade-in duration-200">
                            <h4 className="font-bold text-xs text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                              <Brain className="w-3.5 h-3.5 text-brand-green animate-pulse" />
                              <span>Concept Check-In</span>
                            </h4>
                            <p className="text-xs font-semibold text-brand-forest leading-relaxed">
                              {msg.inlineQuiz.question}
                            </p>
                            
                            <div className="grid grid-cols-1 gap-2">
                              {msg.inlineQuiz!.options.map((option: string, optionIdx: number) => {
                                const selected = inlineQuizAnswers[index] === option;
                                const answered = inlineQuizAnswers[index] !== undefined;
                                const isCorrect = isAnswerMatch(option, msg.inlineQuiz!.answer, msg.inlineQuiz!.options, optionIdx);
                                
                                let btnStyle = "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-700";
                                if (answered) {
                                  if (isCorrect) {
                                    btnStyle = "bg-green-50 border-green-500 text-green-700 font-bold";
                                  } else if (selected) {
                                    btnStyle = "bg-rose-50 border-rose-500 text-rose-700 font-bold";
                                  } else {
                                    btnStyle = "bg-white border-zinc-200 text-zinc-400 opacity-60";
                                  }
                                }

                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    disabled={answered}
                                    onClick={() => {
                                      setInlineQuizAnswers(prev => ({ ...prev, [index]: option }));
                                    }}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                  >
                                    <span>{option}</span>
                                    {answered && isCorrect && (
                                      <span className="w-4 h-4 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">✓</span>
                                    )}
                                    {answered && selected && !isCorrect && (
                                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">✗</span>
                                    )}
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
                                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                        isSelectedCorrect ? 'text-green-600' : 'text-rose-600'
                                      }`}>
                                        {isSelectedCorrect ? 'Correct!' : 'Incorrect'}
                                      </span>
                                      <p className="text-xs text-gray-500 leading-relaxed font-normal">
                                        {msg.inlineQuiz.explanation}
                                      </p>
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

                {/* Streaming Chunk Output parsed as Markdown */}
                {isStreaming && streamingContent && (
                  <div className="flex justify-start w-full">
                    <div className="w-full text-brand-forest py-4 text-sm text-left">
                      {/* Identity Badge */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200/45">
                        <div className="w-6 h-6 rounded-lg bg-brand-green/10 text-brand-green flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        </div>
                        <span className="text-[11px] font-bold text-brand-green uppercase tracking-wider">
                          Braudle Tutor
                        </span>
                      </div>
                      
                      {streamingContent.trim().startsWith('{') ? (
                        <div className="flex items-center gap-2 p-3.5 bg-gray-50 border border-gray-150 rounded-2xl w-fit shadow-2xs">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-brand-green animate-spin" />
                          <span className="text-xs text-brand-forest/65 font-bold">Structuring new study deck...</span>
                        </div>
                      ) : (
                        <MarkdownRenderer content={streamingContent} />
                      )}
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {isStreaming && !streamingContent && (
                  <div className="flex justify-start w-full">
                    <div className="w-full text-brand-forest py-4 text-sm text-left">
                      {/* Identity Badge */}
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-200/45">
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
              </div>
            )}

              {centerTab === 'chat' && !isProcessingDoc && (
                <div className="border-t border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4">
                
                 {/* Floating suggestion pills */}
                 {!isStreaming && !isProcessingDoc && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-left w-full">
                      {[
                        ...(activeSuggestions && activeSuggestions.length > 0
                          ? activeSuggestions.map((suggestionText, idx) => ({ id: `dyn-${idx}`, label: suggestionText }))
                          : (topics && topics.length > 0
                              ? topics.slice(0, 3).map((t, idx) => ({ id: `concept-${idx}`, label: `🔍 Explain ${t}` }))
                              : []
                            )
                        ),
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
                            if (pill.id.startsWith('dyn-')) {
                              setInput(pill.label);
                              setTimeout(() => {
                                const sendBtn = document.getElementById('chat-send-btn');
                                sendBtn?.click();
                              }, 50);
                            } else if (pill.id.startsWith('concept-')) {
                              const cleanLabel = pill.label.replace(/^🔍 Explain /, '');
                              handleConceptClick(cleanLabel);
                            } else {
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
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-full border border-zinc-200 text-xs font-bold text-zinc-600 bg-white hover:bg-zinc-50 hover:text-brand-forest transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                        >
                          {pill.label}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Active Session Error Banner */}
                {activeSessionError && (
                  <div className="relative overflow-hidden rounded-2xl border border-rose-200 bg-rose-50/70 p-4 animate-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold text-rose-800 leading-snug">
                          {activeSessionError.message}
                        </p>
                        {activeSessionError.errorId && (
                          <span className="text-[9px] text-rose-600/70 font-semibold block mt-1">
                            Error ID: {activeSessionError.errorId}
                          </span>
                        )}
                        
                        <div className="flex gap-2.5 mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (lastSentMessage) {
                                triggerTutorStream(lastSentMessage);
                              }
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-[10px] font-extrabold shadow-3xs cursor-pointer select-none active:scale-[0.98] transition-all"
                          >
                            Retry
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveSessionError(null)}
                            className="px-3.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-800 rounded-lg text-[10px] font-extrabold cursor-pointer select-none active:scale-[0.98] transition-all"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Token Limit Lock Banner — shown when 429 hits */}
                {isTokenLimited ? (
                  <div className="relative overflow-hidden rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-forest/5 via-brand-green/8 to-brand-lime/10 shadow-lg">
                    {/* Brand accent line at top */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand-green via-brand-lime to-brand-green" />
                    <div className="px-5 py-4 flex flex-col items-center gap-3 text-center">
                      {/* Lock icon in brand circle */}
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-brand-green to-brand-forest shadow-lg shadow-brand-green/20 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-brand-lime stroke-[2.5px]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-forest leading-snug">You&apos;ve reached your study limit</p>
                        <p className="text-xs text-brand-forest/60 mt-0.5 leading-relaxed">
                          Your AI study time resets in 6 hours{tokenResetTime ? ` (around ${tokenResetTime})` : ''}.
                        </p>
                      </div>
                      {/* Disabled ghost input to show locked state */}
                      <div className="w-full flex items-center gap-3 bg-white/50 border border-brand-green/20 rounded-full px-4 py-2.5 cursor-not-allowed opacity-70">
                        <Lock className="w-3.5 h-3.5 text-brand-green/50 shrink-0" />
                        <span className="flex-1 text-xs text-brand-forest/40 font-medium text-left">Chat is locked until your limit resets&hellip;</span>
                      </div>
                      {/* Upgrade CTA */}
                      <a
                        href="/settings/billing"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-green text-brand-lime text-xs font-bold shadow-md shadow-brand-green/20 hover:bg-brand-forest hover:shadow-brand-forest/30 hover:scale-[1.02] transition-all active:scale-[0.98]"
                      >
                        <Zap className="w-3.5 h-3.5 fill-brand-lime" />
                        Upgrade for more study time
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Centered pill-shaped Prompt Input exactly like NotebookLM */}
                <form onSubmit={handleSendMessageWrapper} className={`relative flex items-center border rounded-full px-4.5 py-2.5 sm:px-5 sm:py-3 transition-all gap-3.5 shadow-2xs ${
                  isProcessingDoc 
                    ? 'bg-gray-100/50 border-gray-150 cursor-not-allowed opacity-60' 
                    : 'bg-white border-gray-250 focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green'
                }`}>
                  <input
                    type="text"
                    required
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isProcessingDoc ? "Tutor is warming up..." : "Start typing..."}
                    className="flex-1 bg-transparent border-none text-base sm:text-xs text-brand-forest focus:outline-none placeholder-gray-400/90 font-medium py-1 disabled:cursor-not-allowed"
                    disabled={isStreaming || isProcessingDoc}
                  />
                  <div className="flex items-center gap-3 shrink-0 select-none">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-55 border border-gray-200 text-gray-500 text-[10px] font-bold select-none cursor-default shrink-0">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <span>(1)</span>
                    </div>
                    <button
                      id="chat-send-btn"
                      type="submit"
                      disabled={isStreaming || isProcessingDoc || !input.trim()}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                        !input.trim() || isStreaming || isProcessingDoc
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-80'
                          : 'bg-brand-green text-white hover:bg-brand-green/90 active:scale-95 cursor-pointer shadow-xs'
                      }`}
                    >
                      <ArrowRight className="w-4.5 h-4.5 stroke-[2.5px]" />
                    </button>
                  </div>
                </form>
                <p className="text-[10px] text-gray-400 font-semibold text-center mt-2.5 leading-none select-none">
                  Braudle can be inaccurate; please double check its responses.
                </p>
                  </>
                )}
              </div>
            )}

            </section>

            {/* PANEL 3: RIGHT PANEL (Studio / Study Modes & Notes) */}
            {(showRightPane || activeMobileTab === 'studio') && (
              <aside className={`bg-white p-6 flex flex-col justify-start overflow-y-auto lg:overflow-hidden shrink-0 z-30 text-left lg:rounded-3xl lg:border lg:border-zinc-200/50 lg:shadow-2xs transition-all duration-300 ease-in-out ${
                activeMobileTab === 'studio' 
                  ? 'flex flex-1 w-full' 
                  : `hidden lg:flex lg:relative ${
                      rightPanelTab === 'studio' 
                        ? 'lg:w-92' 
                        : isExpandedRightPane
                          ? 'flex-1 w-full lg:max-w-none'
                          : 'lg:w-[38vw] xl:w-[35vw] max-w-xl min-w-[350px]'
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
                              ? (isExamSession ? 'Exam Simulation' : 'Practice Quiz') 
                              : rightPanelTab === 'summary'
                                ? 'PDF Study Summary'
                                : 'Flashcard Deck'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {rightPanelTab !== 'studio' && (
                        <button
                          onClick={() => setIsExpandedRightPane(!isExpandedRightPane)}
                          className="hidden lg:flex p-1.5 rounded-xl border border-gray-100 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
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
                   )}

                   {rightPanelTab === 'quiz' && (
                     <div className="animate-in fade-in duration-200 lg:flex-1 lg:flex lg:flex-col lg:min-h-0 lg:h-full">
                      <PracticePanel 
                         quiz={quiz}
                         selectedAnswers={selectedAnswers}
                         setSelectedAnswers={setSelectedAnswers}
                         loadingQuiz={loadingQuiz}
                         submittingQuiz={submittingQuiz}
                         quizResult={quizResult}
                         quizWeakTopics={quizWeakTopics}
                         onClose={() => setRightPanelTab('studio')}
                         onGenerateQuiz={handleGenerateQuiz}
                         onSubmitQuiz={handleQuizSubmit}
                         isEmbed={true}
                         isExam={isExamSession}
                         onGradeQuestion={handleGradeQuestion}
                         onExplainQuestion={handleExplainQuizQuestion}
                         onReviewWeakTopic={handleReviewWeakTopic}
                       />
                     </div>
                   )}

                   {rightPanelTab === 'flashcards' && (
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
                     />
                   )}

                   {rightPanelTab === 'summary' && (
                     <SummaryPanel
                       loadingSummary={loadingSummary}
                       summaryError={summaryError}
                       detailedSummary={detailedSummary}
                       docTitle={docTitle}
                       fetchDetailedSummary={fetchDetailedSummary}
                     />
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

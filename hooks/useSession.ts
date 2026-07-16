import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api, fetchWithRefresh } from '@/lib/api';
import { User } from '@/lib/auth';
import { toast } from '@/lib/toast';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  suggestions?: string[];
  inlineQuiz?: {
    question: string;
    options: string[];
    answer: string;
    explanation: string;
  };
  flashcards?: any[];
}

export function parseMessageTags(msg: ChatMessage): ChatMessage {
  if (msg.role !== 'assistant') return msg;

  let content = msg.content;
  let suggestions: string[] | undefined;
  let inlineQuiz: any | undefined;
  let flashcards: any[] | undefined;

  // Try parsing msg.content as JSON first for structured payloads
  try {
    const data = JSON.parse(content);
    if (data && data.type === 'flashcards' && Array.isArray(data.cards)) {
      content = data.message || "💡 These flashcards have been saved to your profile.";
      flashcards = data.cards;
      return {
        ...msg,
        content,
        flashcards
      };
    }
  } catch {}

  // Regex to match [SUGGESTIONS: [...]] or [SUGGESTIONS: "...", "..."]
  const suggestionsRegex = /\[SUGGESTIONS:\s*(?:\[([\s\S]*?)\]|([\s\S]*?))\]/i;
  const suggestionsMatch = content.match(suggestionsRegex);
  if (suggestionsMatch) {
    const rawVal = (suggestionsMatch[1] || suggestionsMatch[2] || '').trim();
    try {
      suggestions = JSON.parse(`[${rawVal}]`);
    } catch (e) {
      // Fallback 1: match all quoted strings
      const quotedMatches = rawVal.match(/"([^"\\]*(?:\\.[^"\\]*)*)"|'([^'\\]*(?:\\.[^'\\]*)*)'/g);
      if (quotedMatches) {
        suggestions = quotedMatches.map(m => m.slice(1, -1).trim());
      } else {
        // Fallback 2: split by comma and clean
        suggestions = rawVal.split(',').map(s => s.trim().replace(/^["']|["']$/g, '').trim()).filter(Boolean);
      }
    }
    content = content.replace(suggestionsRegex, '').trim();
  }

  // Regex to match [QUIZ_QUESTION: {...}]
  const quizRegex = /\[QUIZ_QUESTION:\s*(\{[\s\S]*?\})\]/;
  const quizMatch = content.match(quizRegex);
  if (quizMatch) {
    try {
      inlineQuiz = JSON.parse(quizMatch[1]);
    } catch (e) {
      console.error('Failed to parse inline quiz JSON:', e);
    }
    content = content.replace(quizRegex, '').trim();
  }

  return {
    ...msg,
    content,
    suggestions,
    inlineQuiz
  };
}

export interface Question {
  _id: string;
  question: string;
  type: 'mcq' | 'theory' | string;
  options?: string[];
  answer?: string;
  explanation?: string;
  studentAnswer?: string;
  isCorrect?: boolean;
  feedback?: string;
  topic?: string;
  sourceSection?: number;
}

export interface WeakTopic {
  topic: string;
  accuracy: number;
  sourceSection?: number;
}

export interface Quiz {
  _id: string;
  sessionId: string;
  documentId: string;
  totalQuestions: number;
  questions: Question[];
  score?: number;
  isExam?: boolean;
  timeLimit?: number;
  revealStyle?: 'instant' | 'end';
  difficulty?: string;
  submittedAt?: string;
  createdAt?: string;
  format?: 'objective' | 'theory' | 'mixed' | 'story-based';
  conceptFocus?: string;
}

export function useSession(sessionId: string) {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  // Initial load states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  
  // Document metadata
  const [documentId, setDocumentId] = useState('');
  const [docTitle, setDocTitle] = useState('Study Source');
  const [topics, setTopics] = useState<string[]>([]);
  const [docSummary, setDocSummary] = useState('');
  const [knowledgeCacheStatus, setKnowledgeCacheStatus] = useState<string>('pending');
  
  // Chat history & streams
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState('understand');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  
  // Quiz panel states
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizWeakTopics, setQuizWeakTopics] = useState<WeakTopic[]>([]);
  const [showRightPane, setShowRightPane] = useState(false);
  const [sessionQuizzes, setSessionQuizzes] = useState<any[]>([]);

  const fetchSessionQuizzes = async () => {
    if (!sessionId) return;
    try {
      const res = await api.get<any>(`/quiz/session/${sessionId}`);
      if (res.quizzes) {
        setSessionQuizzes(res.quizzes);
      }
    } catch (e) {
      console.error('Error fetching session quizzes:', e);
    }
  };

  // Token limit lock state
  const [isTokenLimited, setIsTokenLimited] = useState(false);
  const [tokenResetTime, setTokenResetTime] = useState<string | null>(null);
  const [tokenLimitMessage, setTokenLimitMessage] = useState<string>('');
  const [chatMessagesCount, setChatMessagesCount] = useState(0);
  const [explainMessagesCount, setExplainMessagesCount] = useState(0);

  // Active session stream error & last prompt state
  const [activeSessionError, setActiveSessionError] = useState<{ message: string; errorId?: string | null } | null>(null);
  const [lastSentMessage, setLastSentMessage] = useState<string>('');

  // Time-aware greeting
  const [timeGreeting, setTimeGreeting] = useState('Ready to study');
  const [dueCount, setDueCount] = useState(0);

  const isInitialTriggered = useRef(false);
  const isStreamingRef = useRef(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeGreeting('Ready to study this morning');
    } else if (hour >= 12 && hour < 17) {
      setTimeGreeting('Ready to study this afternoon');
    } else if (hour >= 17 && hour < 21) {
      setTimeGreeting('Ready to study this evening');
    } else {
      setTimeGreeting('Ready to study tonight');
    }
  }, []);

  const loadSessionData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch unified session initialization payload (combines session details, welcome message, and quizzes)
      const sessionRes = await api.get<any>(`/sessions/${sessionId}/init`);
      const historyMessages = (sessionRes.messages || []).map(parseMessageTags);

      if (sessionRes.session) {
        setActiveMode(sessionRes.session.mode || 'understand');
        
        // Track message counts
        if (sessionRes.chatMessagesCount !== undefined) {
          setChatMessagesCount(sessionRes.chatMessagesCount);
        }
        if (sessionRes.explainMessagesCount !== undefined) {
          setExplainMessagesCount(sessionRes.explainMessagesCount);
        }

        // Track limits and lock states
        if (sessionRes.isTokenLimited !== undefined) {
          setIsTokenLimited(sessionRes.isTokenLimited);
          setTokenResetTime(sessionRes.tokenResetTime || null);
          setTokenLimitMessage(sessionRes.tokenLimitMessage || '');
        }

        // Client-side backup enforcement for the document chat limit
        const plan = user?.plan || 'free';
        if (plan !== 'pro' && sessionRes.chatMessagesCount !== undefined) {
          const chatLimit = plan === 'free' ? 20 : 80;
          if (sessionRes.chatMessagesCount >= chatLimit) {
            setIsTokenLimited(true);
            if (!sessionRes.tokenLimitMessage) {
              setTokenLimitMessage(`You've reached your ${plan} plan limit of ${chatLimit} chat messages for this document.`);
            }
          }
        }

        // Track documentId
        const doc = sessionRes.session.documentId;
        if (doc) {
          const docId = doc._id || doc;
          setDocumentId(docId);
          fetchDueCount(docId);
          if (doc.knowledgeCacheStatus) {
            setKnowledgeCacheStatus(doc.knowledgeCacheStatus);
          }
        }
        
        // Check if document is still processing
        if (doc && doc.processingStatus !== 'ready') {
          setIsProcessingDoc(true);
          setProcessingStage(doc.processingStage || 'Initializing Workspace...');
          setDocTitle(doc.title || 'Study Source');
          setLoading(false);
          return;
        } else {
          setIsProcessingDoc(false);
        }
      }

      // 2. Load welcome details from initialization response
      if (sessionRes.welcome) {
        setDocTitle(sessionRes.welcome.documentTitle || 'Study Source');
        setTopics(sessionRes.welcome.topics || []);
        setDocSummary(sessionRes.welcome.summary || '');
        
        const welcomeMsg = sessionRes.welcome.message;
        if (welcomeMsg && historyMessages.length === 0) {
          const welcomeMsgObj = parseMessageTags({
            role: 'assistant' as const,
            content: welcomeMsg,
            timestamp: new Date().toISOString()
          });
          setMessages([welcomeMsgObj]);
        } else {
          setMessages(historyMessages);
        }
      } else {
        setMessages(historyMessages);
      }

      // 3. Populate quizzes from initialization response
      if (sessionRes.quizzes) {
        setSessionQuizzes(sessionRes.quizzes);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load session study space.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    loadSessionData();
  }, [sessionId]);

  useEffect(() => {
    const shouldSubscribe = isProcessingDoc || (documentId && ['pending', 'processing'].includes(knowledgeCacheStatus));
    if (!shouldSubscribe || !documentId) return;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const eventSource = new EventSource(`${apiBaseUrl}/documents/${documentId}/progress`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        setIsProcessingDoc(false);
        loadSessionData();
        return;
      }

      try {
        const parsed = JSON.parse(event.data);
        if (parsed.error) {
          eventSource.close();
          setError(parsed.error);
          return;
        }

        const { status, stage, knowledgeCacheStatus: cacheStatus } = parsed;

        const isExtractionDone = status === 'ready' || parsed.stage === 'ready';
        const isCacheDone = status === 'ready_cache' || status === 'failed_cache' || parsed.stage === 'ready_cache' || parsed.stage === 'failed_cache';

        if (isExtractionDone) {
          setIsProcessingDoc(false);
        }

        if (isCacheDone || status === 'ready_cache') {
          setKnowledgeCacheStatus('ready');
        } else if (status === 'failed_cache') {
          setKnowledgeCacheStatus('failed');
        } else if (status === 'processing_cache' || parsed.status === 'processing_cache') {
          setKnowledgeCacheStatus('processing');
        }

        if (status === 'ready' || status === 'ready_cache' || status === 'failed_cache') {
          loadSessionData();
        } else {
          if (stage) setProcessingStage(stage);
          if (cacheStatus) setKnowledgeCacheStatus(cacheStatus);
        }
      } catch (e) {
        // Ignore parse errors on heartbeats/arbitrary text
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      
      // Connection lost fallback check after 5s
      const timer = setTimeout(async () => {
        try {
          const res = await api.get<any>(`/sessions/${sessionId}`);
          if (res.session && res.session.documentId) {
            const status = res.session.documentId.processingStatus;
            const stage = res.session.documentId.processingStage;
            const cacheStatus = res.session.documentId.knowledgeCacheStatus;

            if (status === 'ready') {
              setIsProcessingDoc(false);
              loadSessionData();
            } else if (status === 'failed') {
              setError('Document analysis failed. Please verify the content and try again.');
            } else {
              if (stage) setProcessingStage(stage);
              if (cacheStatus) setKnowledgeCacheStatus(cacheStatus);
            }
          }
        } catch {}
      }, 5000);

      return () => clearTimeout(timer);
    };

    return () => {
      eventSource.close();
    };
  }, [isProcessingDoc, documentId, sessionId, knowledgeCacheStatus]);

  const triggerTutorStream = async (messageText: string) => {
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;
    setIsStreaming(true);
    setStreamingContent('');
    setActiveSessionError(null);

    let accumulatedText = '';
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${backendUrl}/sessions/${sessionId}/chat`;

      const response = await fetchWithRefresh(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message: messageText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          // Token limit hit — lock the chat like Claude's usage limit
          const resetAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setIsTokenLimited(true);
          setTokenResetTime(resetAt);
          setTokenLimitMessage(errorData.message || "You've reached today's AI study limit.");
          return; // Don't throw — we handle it via the lock UI
        }
        
        const err: any = new Error(errorData.message || 'Failed to connect to tutoring engine.');
        err.status = response.status;
        err.errorId = errorData.errorId || null;
        throw err;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) return;

      let buffer = '';
      accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Hold incomplete bytes

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                
                // Clean dynamic tags out of active streaming view
                let cleanStream = accumulatedText.trim();
                if (cleanStream.startsWith('{')) {
                  const messageMatch = cleanStream.match(/"message"\s*:\s*"([^"]*)"/);
                  if (messageMatch) {
                    setStreamingContent(messageMatch[1]);
                  } else {
                    setStreamingContent("⚡ Creating your custom flashcards...");
                  }
                } else {
                  cleanStream = cleanStream.split('[SUGGESTIONS:')[0];
                  cleanStream = cleanStream.split('[QUIZ_QUESTION:')[0];
                  setStreamingContent(cleanStream.trim());
                }
              } else if (parsed.error) {
                const err: any = new Error(parsed.error);
                err.errorId = parsed.errorId || null;
                throw err;
              }
            } catch (e) {
              // JSON parse issues can occur if S3 chunks split characters
            }
          }
        }
      }

      if (accumulatedText) {
        const parsedMsg = parseMessageTags({ role: 'assistant', content: accumulatedText });
        setMessages(prev => [...prev, parsedMsg]);
      }
    } catch (err: any) {
      console.error(err);
      
      let clientMessage = err.message || 'Tutoring connection timed out. Please check your internet connection.';
      if (!err.status || err.message.toLowerCase().includes('connect') || err.message.toLowerCase().includes('internet') || err.message.toLowerCase().includes('network')) {
        clientMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (err.status >= 500) {
        clientMessage = 'An unexpected error occurred. We are having trouble communicating with the server.';
      } else if (err.status === 401 || err.status === 403) {
        clientMessage = 'Your session has expired. Please log in again.';
      }
      
      setActiveSessionError({
        message: clientMessage,
        errorId: err.errorId || null
      });
    } finally {
      if (accumulatedText) {
        setChatMessagesCount(prev => {
          const nextCount = prev + 1;
          const plan = user?.plan || 'free';
          if (plan !== 'pro') {
            const chatLimit = plan === 'free' ? 20 : 80;
            if (nextCount >= chatLimit) {
              setIsTokenLimited(true);
              setTokenLimitMessage(`You've reached your ${plan} plan limit of ${chatLimit} chat messages for this document.`);
            }
          }
          return nextCount;
        });
      }
      setStreamingContent('');
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  const triggerExplainStream = async (selectedText: string) => {
    if (isStreamingRef.current) return;
    isStreamingRef.current = true;
    setIsStreaming(true);
    setStreamingContent('');
    setActiveSessionError(null);

    let accumulatedText = '';
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${backendUrl}/sessions/${sessionId}/explain-selection`;

      const response = await fetchWithRefresh(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ selectedText })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          const resetAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setIsTokenLimited(true);
          setTokenResetTime(resetAt);
          setTokenLimitMessage(errorData.message || "You've reached today's AI study limit.");
          return;
        }
        
        const err: any = new Error(errorData.message || 'Failed to connect to tutoring engine.');
        err.status = response.status;
        err.errorId = errorData.errorId || null;
        throw err;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) return;

      let buffer = '';
      accumulatedText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                setStreamingContent(accumulatedText.trim());
              } else if (parsed.error) {
                const err: any = new Error(parsed.error);
                err.errorId = parsed.errorId || null;
                throw err;
              }
            } catch (e) {
              // Ignore split JSON parts
            }
          }
        }
      }

      if (accumulatedText) {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulatedText }]);
      }
    } catch (err: any) {
      console.error(err);
      let clientMessage = err.message || 'Tutoring connection timed out. Please check your internet connection.';
      if (!err.status || err.message.toLowerCase().includes('connect') || err.message.toLowerCase().includes('internet') || err.message.toLowerCase().includes('network')) {
        clientMessage = 'Connection failed. Please check your internet connection and try again.';
      } else if (err.status >= 500) {
        clientMessage = 'An unexpected error occurred. We are having trouble communicating with the server.';
      } else if (err.status === 401 || err.status === 403) {
        clientMessage = 'Your session has expired. Please log in again.';
      }
      setActiveSessionError({
        message: clientMessage,
        errorId: err.errorId || null
      });
    } finally {
      if (accumulatedText) {
        setExplainMessagesCount(prev => prev + 1);
      }
      setStreamingContent('');
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  const handleSendMessage = (e?: React.FormEvent, customMessage?: string) => {
    if (e) e.preventDefault();
    const userText = customMessage !== undefined ? customMessage : input.trim();
    if (!userText || isStreaming) return;

    setInput('');
    setActiveSessionError(null);
    setLastSentMessage(userText);
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    triggerTutorStream(userText);
  };

  const handleModeChange = async (mode: string, skipAiTrigger = false) => {
    if (isStreamingRef.current || isStreaming) return;
    try {
      setActiveMode(mode);
      setActiveSessionError(null);
      await api.patch(`/sessions/${sessionId}/state`, { mode });
      setMessages(prev => [...prev, { role: 'system', content: `Study method switched to ${mode.toUpperCase()}.` }]);
      if (!skipAiTrigger) {
        triggerTutorStream(`I want to switch our study focus to ${mode} mode. Let's adapt.`);
      }
    } catch (err: any) {
      toast.error('Failed to update study mode. Please try again.');
    }
  };

  const handleGenerateQuiz = async (
    format?: string,
    numQuestions?: number,
    instructions?: string,
    isExam?: boolean,
    difficulty?: string,
    timeLimit?: number,
    revealStyle?: 'instant' | 'end',
    conceptFocus?: string
  ) => {
    setLoadingQuiz(true);
    setQuizResult(null);
    setQuiz(null);
    setSelectedAnswers({});
    setQuizWeakTopics([]);
    setShowRightPane(true);

    try {
      let response;
      if (format) {
        response = await api.post<any>('/quiz/custom', {
          documentId,
          sessionId,
          format,
          numQuestions: numQuestions || 15,
          instructions,
          difficulty: difficulty || 'medium',
          isExam: !!isExam,
          timeLimit: timeLimit || 0,
          revealStyle: revealStyle || 'instant',
          conceptFocus,
        });
      } else {
        response = await api.post<any>('/quiz/generate', { sessionId });
      }

      if (response.quiz) {
        setQuiz(response.quiz);
        await fetchSessionQuizzes();
      } else {
        throw new Error('No quiz payload returned.');
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz || submittingQuiz) return;

    const answersList = Object.entries(selectedAnswers).map(([qId, ans]) => ({
      questionId: qId,
      answer: ans
    }));

    if (answersList.length < quiz.questions.length) {
      toast.warning('Please answer all questions before submitting.');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const result = await api.post<any>(`/quiz/${quiz._id}/submit`, {
        answers: answersList
      });
      setQuizResult(result);
      if (result.quiz) {
        setQuiz(result.quiz);
      }
      if (result.weakTopics) {
        setQuizWeakTopics(result.weakTopics);
      }
      setMessages(prev => [
        ...prev, 
        { role: 'system', content: `Practice test completed! Scored ${result.score}%. View detailed answers in the sidebar.` }
      ]);
      await fetchSessionQuizzes();
    } catch (err: any) {
      toast.error('Quiz grading failed. Please try again.');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleFinishSession = async () => {
    try {
      setLoading(true);
      await api.patch(`/sessions/${sessionId}/complete`, {});
      router.replace('/home');
    } catch (err: any) {
      toast.error('Failed to finish session. Please try again.');
      setLoading(false);
    }
  };

  const fetchDueCount = async (docId?: string) => {
    const targetDocId = docId || documentId;
    if (!targetDocId) return;
    try {
      const res = await api.get<any>(`/mastery/due?documentId=${targetDocId}`);
      if (res && res.dueConcepts) {
        setDueCount(res.dueConcepts.length);
      }
    } catch (e) {
      console.error('Failed to fetch due count:', e);
    }
  };

  const handleRateConcept = async (conceptName: string, quality: number) => {
    if (!documentId) return;
    try {
      await api.post<any>('/mastery/review', {
        documentId,
        conceptName,
        quality
      });
      if (user) {
        setUser({
          ...user,
          xp: (user.xp || 0) + 5
        });
      }
      await fetchDueCount();
    } catch (e) {
      console.error('Failed to rate concept:', e);
    }
  };

  const handleGradeQuestion = async (questionId: string, answer: string) => {
    if (!quiz) return null;
    try {
      const response = await api.post<any>(`/quiz/${quiz._id}/grade-question`, {
        questionId,
        answer
      });
      
      // Update local quiz state with the graded question
      setQuiz(prevQuiz => {
        if (!prevQuiz) return null;
        const updatedQuestions = prevQuiz.questions.map(q => {
          if (q._id === questionId) {
            return {
              ...q,
              studentAnswer: answer,
              isCorrect: response.isCorrect,
              feedback: response.feedback,
              explanation: response.explanation
            };
          }
          return q;
        });

        return {
          ...prevQuiz,
          score: response.quizScore,
          questions: updatedQuestions
        };
      });

      // Update weak topics in real-time (instant reveal mode)
      if (response.weakTopics) {
        setQuizWeakTopics(response.weakTopics);
      }

      // Reload history list
      await fetchSessionQuizzes();
      
      return response;
    } catch (err: any) {
      toast.error('Question grading failed. Please try again.');
      return null;
    }
  };

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const activeSuggestions = lastAssistantMessage?.suggestions || [];

  return {
    loading,
    error,
    isProcessingDoc,
    processingStage,
    documentId,
    docTitle,
    topics,
    docSummary,
    knowledgeCacheStatus,
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
    handleFinishSession,
    handleGradeQuestion,
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
    handleRateConcept
  };
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { User } from '@/lib/auth';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
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
}

export interface Quiz {
  _id: string;
  sessionId: string;
  documentId: string;
  totalQuestions: number;
  questions: Question[];
  score?: number;
  isExam?: boolean;
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

  // Time-aware greeting
  const [timeGreeting, setTimeGreeting] = useState('Ready to study');

  const isInitialTriggered = useRef(false);

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
      // 1. Fetch current session log & messages
      const sessionRes = await api.get<any>(`/sessions/${sessionId}`);
      const historyMessages = sessionRes.messages || [];
      setMessages(historyMessages);

      if (sessionRes.session) {
        setActiveMode(sessionRes.session.mode || 'understand');
        
        // Track documentId
        const doc = sessionRes.session.documentId;
        if (doc) {
          setDocumentId(doc._id || doc);
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

      // 2. Fetch welcome context
      const welcomeRes = await api.get<any>(`/sessions/${sessionId}/welcome`);
      if (welcomeRes.welcome) {
        setDocTitle(welcomeRes.welcome.documentTitle || 'Study Source');
        setTopics(welcomeRes.welcome.topics || []);
        setDocSummary(welcomeRes.welcome.summary || '');
        
        const welcomeMsg = welcomeRes.welcome.message;
        if (welcomeMsg && historyMessages.length === 0) {
          const welcomeMsgObj = {
            role: 'assistant' as const,
            content: welcomeMsg,
            timestamp: new Date().toISOString()
          };
          setMessages([welcomeMsgObj]);
        } else {
          setMessages(historyMessages);
        }
      } else {
        setMessages(historyMessages);
      }
      // Fetch session quizzes
      await fetchSessionQuizzes();
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

    const timer = setInterval(async () => {
      if (isProcessingDoc) {
        try {
          const res = await api.get<any>(`/sessions/${sessionId}`);
          if (res.session && res.session.documentId) {
            const status = res.session.documentId.processingStatus;
            const stage = res.session.documentId.processingStage;
            setProcessingStage(stage || 'Analyzing...');
            if (status === 'ready') {
              setIsProcessingDoc(false);
              // Reload fully once document is ready
              const sessionRes = await api.get<any>(`/sessions/${sessionId}`);
              const historyMsgs = sessionRes.messages || [];
              setMessages(historyMsgs);
              
              const welcomeRes = await api.get<any>(`/sessions/${sessionId}/welcome`);
              if (welcomeRes.welcome) {
                setDocTitle(welcomeRes.welcome.documentTitle || 'Study Source');
                setTopics(welcomeRes.welcome.topics || []);
                setDocSummary(welcomeRes.welcome.summary || '');
                
                const welcomeMsg = welcomeRes.welcome.message;
                if (welcomeMsg && historyMsgs.length === 0) {
                  const welcomeMsgObj = {
                    role: 'assistant' as const,
                    content: welcomeMsg,
                    timestamp: new Date().toISOString()
                  };
                  setMessages([welcomeMsgObj]);
                } else {
                  setMessages(historyMsgs);
                }
              } else {
                setMessages(historyMsgs);
              }
            }
          }
        } catch (e) {
          console.error('Error polling status:', e);
        }
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [sessionId, isProcessingDoc]);

  const triggerTutorStream = async (messageText: string) => {
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${backendUrl}/sessions/${sessionId}/chat`;

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ message: messageText }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to connect to tutoring engine.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) return;

      let buffer = '';
      let accumulatedText = '';

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
                setStreamingContent(accumulatedText);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // JSON parse issues can occur if S3 chunks split characters
            }
          }
        }
      }

      if (accumulatedText) {
        setMessages(prev => [...prev, { role: 'assistant', content: accumulatedText }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: `Error: ${err.message || 'Tutoring connection timed out. Please try sending your prompt again.'}` }
      ]);
    } finally {
      setStreamingContent('');
      setIsStreaming(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    triggerTutorStream(userText);
  };

  const handleModeChange = async (mode: string) => {
    if (isStreaming) return;
    try {
      setActiveMode(mode);
      await api.patch(`/sessions/${sessionId}/state`, { mode });
      setMessages(prev => [...prev, { role: 'system', content: `Study method switched to ${mode.toUpperCase()}.` }]);
      triggerTutorStream(`I want to switch our study focus to ${mode} mode. Let's adapt.`);
    } catch (err: any) {
      alert(`Failed to update mode: ${err.message}`);
    }
  };

  const handleGenerateQuiz = async (format?: string, numQuestions?: number, instructions?: string, isExam?: boolean) => {
    setLoadingQuiz(true);
    setQuizResult(null);
    setQuiz(null);
    setSelectedAnswers({});
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
          difficulty: 'medium',
          isExam: !!isExam
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
      alert(`Failed to generate practice test: ${err.message}`);
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
      alert('Please respond to all practice questions before submitting.');
      return;
    }

    setSubmittingQuiz(true);
    try {
      const result = await api.post<any>(`/quiz/${quiz._id}/submit`, {
        answers: answersList
      });
      setQuizResult(result);
      setMessages(prev => [
        ...prev, 
        { role: 'system', content: `Practice test completed! Scored ${result.score}%. View detailed answers in the sidebar.` }
      ]);
      await fetchSessionQuizzes();
    } catch (err: any) {
      alert(`Grading failed: ${err.message}`);
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
      alert(`Failed to finish session correctly: ${err.message}`);
      setLoading(false);
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

      // Reload history list
      await fetchSessionQuizzes();
      
      return response;
    } catch (err: any) {
      alert(`Grading failed: ${err.message}`);
      return null;
    }
  };

  return {
    loading,
    error,
    isProcessingDoc,
    processingStage,
    documentId,
    docTitle,
    topics,
    docSummary,
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
    sessionQuizzes,
    fetchSessionQuizzes
  };
}

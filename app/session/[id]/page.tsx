'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, postStream } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2, ArrowLeft, Bot, Send, MoreVertical, BrainCircuit, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface SessionWelcome {
  documentId: string;
  status: string;
  welcome: {
    message: string;
    topics: string[];
    summary: string;
    documentTitle: string;
    learningModes: { id: string; label: string; description: string }[];
  };
  progress?: {
    completedConcepts: number;
    totalConcepts: number;
  };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sessionData, setSessionData] = useState<SessionWelcome | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  useEffect(() => {
    async function initSession() {
      try {
        // Try to fetch existing session metadata & messages
        const sessionHistory = await api.get<{ session: any; messages: any[] }>(`/sessions/${params.id}`).catch(() => null);
        
        if (sessionHistory && sessionHistory.messages && sessionHistory.messages.length > 0) {
           // We have history, load it
           setMessages(sessionHistory.messages.map((m, i) => ({
             id: `hist-${i}`,
             role: m.role,
             content: m.content
           })));
           
           // We still might want welcome metadata for modes, but we'll assume standard modes
           setLoading(false);
           return;
        }

        // If no history, fetch welcome
        const res = await api.get<SessionWelcome>(`/sessions/${params.id}/welcome`);
        setSessionData(res);
        
        if (res.welcome && res.welcome.message) {
          setMessages([{
            id: 'welcome-msg',
            role: 'assistant',
            content: res.welcome.message
          }]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) {
      initSession();
    }
  }, [params.id]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: '' };
    
    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputText('');
    setIsStreaming(true);

    await postStream(
      `/sessions/${params.id}/chat`,
      { message: text.trim() },
      (token) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + token
          };
          return newMessages;
        });
      },
      () => {
        setIsStreaming(false);
      },
      (err) => {
        console.error("Stream error:", err);
        setIsStreaming(false);
        setMessages(prev => {
          const newMessages = [...prev];
          const lastIndex = newMessages.length - 1;
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: newMessages[lastIndex].content + '\n\n**[Error: Connection interrupted]**'
          };
          return newMessages;
        });
      }
    );
  };

  const handleSuggestedAction = async (action: string) => {
    if (action === "Quiz Me" || action === "Take Quiz") {
      try {
        setLoading(true);
        const res = await api.post<any>('/quiz/generate', { sessionId: params.id });
        if (res.status === 'success' && res.quiz?._id) {
          router.push(`/quiz/${res.quiz._id}`);
        } else {
          throw new Error('Could not generate quiz');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to generate quiz');
        setLoading(false);
      }
    } else {
      handleSendMessage(action);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const startQuiz = () => handleSuggestedAction("Take Quiz");

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F2]">
        <div className="w-8 h-8 rounded-lg bg-[#4A783A] flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 bg-[#C2E1A6] rounded-sm rotate-45" />
        </div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F2] p-6 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-medium text-[#1B3B2B] mb-2">Session Error</h2>
        <p className="text-[#6B7280] mb-6">{error || 'Could not load session data.'}</p>
        <button 
          onClick={() => router.push('/dashboard')}
          className="bg-[#4A783A] text-white px-6 py-2.5 rounded-xl font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Fallback progress if unavailable
  const progressPercent = sessionData?.progress 
    ? Math.round((sessionData.progress.completedConcepts / sessionData.progress.totalConcepts) * 100) || 0
    : 0;

  return (
    <div className="flex flex-col h-screen bg-[#F6F7F2] text-[#1B3B2B] font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7DF] px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F6F7F2] text-[#6B7280] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EDF5E8] rounded-xl flex items-center justify-center text-[#4A783A]">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-semibold text-sm line-clamp-1">{sessionData?.welcome?.documentTitle || 'Braudle Tutor'}</h1>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-medium">
                <span className="w-1.5 h-1.5 bg-[#4A783A] rounded-full animate-pulse"></span>
                Active Session
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[10px] uppercase font-bold text-[#6B7280] tracking-wider mb-0.5">Mastery</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-[#E5E7DF] rounded-full overflow-hidden">
                <div className="h-full bg-[#4A783A] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-[#4A783A]">{progressPercent}%</span>
            </div>
          </div>
          
          <button 
            onClick={startQuiz}
            className="bg-[#EDF5E8] text-[#4A783A] hover:bg-[#e1f0da] px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 border border-[#C2E1A6]/50"
          >
            <BrainCircuit className="w-4 h-4" />
            <span className="hidden sm:inline">Take Quiz</span>
          </button>

          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#F6F7F2] text-[#6B7280] transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
          
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex gap-4 max-w-2xl animate-in slide-in-from-bottom-2 fade-in duration-300 ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'bg-[#E5E7DF] text-[#6B7280]' : 'bg-[#4A783A]'}`}>
                {msg.role === 'user' ? (
                  <span className="text-xs font-bold">{user?.name?.charAt(0) || 'U'}</span>
                ) : (
                  <div className="w-4 h-4 bg-[#C2E1A6] rounded-sm rotate-45" />
                )}
              </div>
              
              <div className="space-y-4 w-full">
                {/* Bubble */}
                <div className={`p-5 rounded-2xl shadow-sm prose prose-sm max-w-none break-words ${
                    msg.role === 'user' 
                      ? 'bg-[#4A783A] text-white rounded-tr-sm border border-[#3D6330]' 
                      : 'bg-white border border-[#E5E7DF] text-[#1B3B2B] rounded-tl-sm'
                  }`}
                >
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {msg.role === 'assistant' && isStreaming && idx === messages.length - 1 && (
                    <span className="inline-block w-2 h-4 ml-1 bg-[#C2E1A6] animate-pulse"></span>
                  )}
                </div>

                {/* Suggested Actions (only show after first welcome message if it exists) */}
                {msg.role === 'assistant' && idx === 0 && sessionData?.welcome?.learningModes && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {sessionData.welcome.learningModes.map((mode) => (
                      <button 
                        key={mode.id}
                        onClick={() => handleSuggestedAction(mode.label)}
                        disabled={isStreaming}
                        className="bg-[#EDF5E8] hover:bg-[#e1f0da] text-[#4A783A] border border-[#C2E1A6]/50 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                        title={mode.description}
                      >
                        <BrainCircuit className="w-4 h-4" />
                        {mode.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-[#E5E7DF] p-4 pb-safe shrink-0">
        <div className="max-w-3xl mx-auto relative flex items-end gap-2">
          <div className="relative flex-1 bg-[#F6F7F2] border border-[#D1D5C9] rounded-2xl focus-within:border-[#4A783A] focus-within:ring-1 focus-within:ring-[#4A783A] transition-shadow">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={isStreaming ? "Braudle is typing..." : "Ask a question or request a quiz..."}
              className="w-full bg-transparent max-h-32 min-h-[52px] py-3.5 pl-4 pr-12 text-[15px] resize-none focus:outline-none scrollbar-hide disabled:opacity-50"
              rows={1}
            />
          </div>
          <button 
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim() || isStreaming}
            className="w-[52px] h-[52px] shrink-0 bg-[#4A783A] hover:bg-[#3D6330] disabled:bg-[#E5E7DF] disabled:text-[#9CA3AF] text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </div>
        <p className="text-center text-[11px] text-[#9CA3AF] mt-3">
          Braudle AI can make mistakes. Consider verifying critical information.
        </p>
      </footer>
    </div>
  );
}

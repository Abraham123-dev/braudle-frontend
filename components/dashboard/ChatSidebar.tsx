'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, X, Trash2, AlertTriangle, Loader2, 
  ImageIcon, Plus, Minus, Search, ArrowLeft, Menu, 
  Edit2, Check, Sparkles, ArrowUp, BookOpen, Lightbulb,
  PenLine, BrainCircuit
} from 'lucide-react';
import { api, fetchWithRefresh } from '@/lib/api';
import { useStore } from '@/lib/store';
import { toast } from '@/lib/toast';
import MarkdownRenderer from '../tutor/MarkdownRenderer';
import Logo from '@/components/Logo';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    name: string;
    fileType: 'image';
  }>;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatSidebar({ isOpen, onClose }: ChatSidebarProps) {
  const router = useRouter();
  const user = useStore((state) => state.user);

  /* Sessions List States */
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);

  /* Messages in active session */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analyzedImage, setAnalyzedImage] = useState<{
    name: string;
    fileUrl: string;
    imageHash?: string;
    analysis?: any;
  } | null>(null);

  /* Session Renaming States */
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  /* Global lock / Limit states */
  const [tokensUsed, setTokensUsed] = useState(0);
  const [remainingTokens, setRemainingTokens] = useState(20000);
  const [isDailyLocked, setIsDailyLocked] = useState(false);
  const [isConversationLocked, setIsConversationLocked] = useState(false);

  /* UI layout states */
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch all sessions and rate-limiting details
  const fetchSessionsAndLimits = async (selectLatest = false) => {
    setLoadingSessions(true);
    try {
      const res = await api.get<any>('/general-chat');
      const sessionList = res.sessions || [];
      setSessions(sessionList);

      if (res.usage) {
        setTokensUsed(res.usage.tokensUsed || 0);
        setIsDailyLocked(!!res.usage.isLocked);
        setRemainingTokens(res.usage.remainingTokens || 0);
      }

      // Automatically select latest session if requested or if none selected yet
      if (sessionList.length > 0) {
        if (selectLatest || !activeSessionId) {
          const latestSessionId = sessionList[0].id;
          setActiveSessionId(latestSessionId);
          await fetchSessionMessages(latestSessionId);
        }
      } else {
        // Automatically create a new session if none exist
        await handleCreateSession();
      }
    } catch (err) {
      console.error('[CHAT] Failed to load sessions list:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Fetch messages for a specific session
  const fetchSessionMessages = async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api.get<any>(`/general-chat/${sessionId}`);
      if (res.session) {
        setMessages(res.session.messages || []);
        setIsConversationLocked(!!res.session.isLocked);
      }
    } catch (err) {
      console.error(`[CHAT] Failed to load messages for session ${sessionId}:`, err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Create new session via API
  const handleCreateSession = async () => {
    try {
      const res = await api.post<any>('/general-chat');
      if (res.session) {
        const newSession = res.session;
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([]);
        setIsConversationLocked(false);
        setIsSidebarOpenMobile(false);
      }
    } catch (err) {
      console.error('[CHAT] Failed to create new session:', err);
    }
  };

  // Switch active session
  const handleSelectSession = async (sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsSidebarOpenMobile(false);
    await fetchSessionMessages(sessionId);
  };

  // Delete session via API
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat history?')) return;

    try {
      await api.delete(`/general-chat/${sessionId}`);
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);

      if (activeSessionId === sessionId) {
        if (updatedSessions.length > 0) {
          const nextSessionId = updatedSessions[0].id;
          setActiveSessionId(nextSessionId);
          fetchSessionMessages(nextSessionId);
        } else {
          // If no sessions left, create one
          handleCreateSession();
        }
      }
    } catch (err) {
      console.error('[CHAT] Failed to delete session:', err);
    }
  };

  // Start rename session mode
  const startRenameSession = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // Save renamed session title via API
  const handleSaveRename = async (sessionId: string) => {
    const cleanTitle = editingTitle.trim();
    if (!cleanTitle) {
      setEditingSessionId(null);
      return;
    }

    try {
      const res = await api.put<any>(`/general-chat/${sessionId}`, { title: cleanTitle });
      if (res.session) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, title: cleanTitle } : s))
        );
      }
    } catch (err) {
      console.error('[CHAT] Failed to rename session:', err);
    } finally {
      setEditingSessionId(null);
    }
  };

  // Initial load
  useEffect(() => {
    if (!isOpen) return;
    fetchSessionsAndLimits(true);
  }, [isOpen]);

  // Scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingResponse]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  if (!isOpen) return null;

  const handleUploadImage = async (file: File) => {
    if (!activeSessionId) return;
    setIsAnalyzingImage(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const uploadUrl = `${backendUrl}/general-chat/${activeSessionId}/upload`;
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchWithRefresh(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to analyze image.');
      }

      const resData = await response.json();
      if (resData.status === 'success') {
        setAnalyzedImage({
          name: resData.fileName || file.name,
          fileUrl: resData.fileUrl,
          imageHash: resData.imageHash,
          analysis: resData.analysis,
        });
      }
    } catch (err: any) {
      console.error('[CHAT] Immediate analysis error:', err);
      toast.error('Failed to analyze image. Please try again.');
      setSelectedFile(null);
      setAnalyzedImage(null);
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Handle selected file checking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImgExt = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(extension || '');
      const isImage = file.type.startsWith('image/') || isImgExt;
      
      if (!isImage) {
        toast.info('Only image files are allowed in General Chat. PDFs can be studied in your Library.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.warning('Image size exceeds the 10MB limit.');
        return;
      }
      setSelectedFile(file);
      handleUploadImage(file);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const messageToSend = customText !== undefined ? customText : inputText;
    const cleanText = messageToSend.trim();
    if (!cleanText && !selectedFile && !analyzedImage) return;
    if (isSending || isAnalyzingImage || isDailyLocked || isConversationLocked || !activeSessionId) return;

    setIsSending(true);
    setStreamingResponse('');
    setInputText('');

    // Optimistically add user message
    const optimUserMsg: ChatMessage = {
      role: 'user',
      content: cleanText,
      attachments: selectedFile ? [{
        name: selectedFile.name,
        fileType: 'image'
      }] : []
    };
    setMessages((prev) => [...prev, optimUserMsg]);

    const backupFile = selectedFile;
    const backupAnalyzed = analyzedImage;
    setSelectedFile(null);
    setAnalyzedImage(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${backendUrl}/general-chat/${activeSessionId}/message`;

      const formData = new FormData();
      formData.append('message', cleanText);
      if (backupAnalyzed?.imageHash) {
        formData.append('imageHash', backupAnalyzed.imageHash);
      }
      // Fallback: only attach the physical file if it has not been pre-analyzed in background
      if (backupFile && !backupAnalyzed) {
        formData.append('file', backupFile);
      }

      const response = await fetchWithRefresh(streamUrl, {
        method: 'POST',
        headers: {
          'Accept': 'text/event-stream'
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: any = new Error(errorData.message || 'Failed to connect to AI Chat engine.');
        error.code = errorData.code;
        throw error;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) return;

      let buffer = '';
      let accumulatedText = '';
      let serverRenamedTitle = '';

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
            
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                setStreamingResponse(accumulatedText);
              } else if (parsed.done) {
                // Update stats and potential automatic title rename
                setTokensUsed(parsed.tokensUsed || 0);
                setIsDailyLocked(!!parsed.isLocked);
                setRemainingTokens(parsed.remainingTokens || 0);
                if (parsed.title) {
                  serverRenamedTitle = parsed.title;
                }
                break;
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Ignore invalid JSON on SSE fragments
            }
          }
        }
      }

      if (accumulatedText) {
        setMessages((prev) => [...prev, { role: 'assistant', content: accumulatedText }]);
      }

      // If session title was auto-renamed, update in local list state
      if (serverRenamedTitle) {
        setSessions((prev) =>
          prev.map((s) => (s.id === activeSessionId ? { ...s, title: serverRenamedTitle } : s))
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'TOKEN_LIMIT_EXCEEDED') {
        setIsDailyLocked(true);
      } else if (err.code === 'CONVERSATION_LIMIT_EXCEEDED') {
        setIsConversationLocked(true);
      } else {
        let displayError = '⚠️ Something went wrong on our end. Please try again in a moment.';
        if (!err.status || err.message.toLowerCase().includes('connect') || err.message.toLowerCase().includes('internet') || err.message.toLowerCase().includes('network')) {
          displayError = '⚠️ Connection failed. Please check your internet connection and try again.';
        }
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: displayError }
        ]);
      }
    } finally {
      setIsSending(false);
      setStreamingResponse('');
    }
  };

  // Filter sessions by search term
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const firstName = user?.name ? user.name.split(' ')[0] : 'Student';

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const greetings = user?.name ? [
      `Your move, ${firstName}`,
      `What are we learning today, ${firstName}?`,
      `How can I help you study, ${firstName}?`,
      `What should we master today, ${firstName}?`,
      `Ready to learn, ${firstName}?`,
      `What's on your study list today, ${firstName}?`,
      `Let's solve some problems, ${firstName}!`,
      `Where should we start, ${firstName}?`
    ] : [
      'Where should we start?',
      'What are we learning today?',
      'How can I help you study?',
      'What should we master today?',
      'Ready to learn?',
      "What's on your study list today?",
      "Let's solve some problems!"
    ];
    const randomIdx = Math.floor(Math.random() * greetings.length);
    setGreeting(greetings[randomIdx]);
  }, [firstName, user?.name]);

  // Suggestions for prompt builder
  const promptSuggestions = [
    {
      icon: <Lightbulb className="w-5 h-5" />,
      title: 'Explain a concept',
      description: 'Break down photosynthesis simply',
      prompt: 'Can you explain photosynthesis to me step-by-step in simple terms?'
    },
    {
      icon: <PenLine className="w-5 h-5" />,
      title: 'Draft a study plan',
      description: 'Create a guide for my exams',
      prompt: 'Help me draft a comprehensive study outline/guide for my upcoming exams.'
    },
    {
      icon: <BrainCircuit className="w-5 h-5" />,
      title: 'Solve a problem',
      description: 'Walk me through quadratic equations',
      prompt: 'Show me step-by-step how to solve a quadratic equation using the quadratic formula.'
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Brainstorm ideas',
      description: 'Active recall ideas for Biology',
      prompt: 'Give me some active recall study question ideas for college Biology.'
    }
  ];

  // ─── Braudle Sparkle Avatar ───
  const BraudleAvatar = () => (
    <Logo size={32} className="rounded-lg shrink-0" />
  );

  // ─── Streaming Indicator Dots ───
  const ThinkingDots = () => (
    <div className="flex items-center gap-1.5 py-1">
      <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-brand-green/60 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );

  const renderInputForm = () => {
    if (isDailyLocked) {
      return (
        <div className="w-full border border-rose-200/60 bg-rose-50 rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-left shadow-sm">
          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 space-y-2.5">
            <h4 className="font-bold text-sm text-rose-800">
              Daily access limit reached
            </h4>
            <p className="text-xs sm:text-sm text-rose-700/80 leading-relaxed font-normal">
              You've used all of your AI chat access for now. Come back later when it resets, or upgrade for more.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="bg-brand-green hover:bg-brand-forest text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Upgrade
              </button>
              <button
                type="button"
                onClick={onClose}
                className="bg-white border border-gray-200 text-brand-forest hover:bg-gray-50 text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Try Later
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (isConversationLocked) {
      return (
        <div className="w-full border border-brand-green/20 bg-brand-green/[0.03] rounded-2xl p-4 sm:p-5 flex items-start gap-3 text-left shadow-sm">
          <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
            <MessageSquare className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 space-y-2.5">
            <h4 className="font-bold text-sm text-brand-forest">
              Conversation limit reached
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
              Start a new chat to keep going, or upgrade for longer conversations.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleCreateSession}
                className="bg-brand-green hover:bg-brand-forest text-white text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                New Chat
              </button>
              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="bg-white border border-gray-200 text-brand-forest hover:bg-gray-50 text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={handleSendMessage} className="w-full">
        {selectedFile && (
          <div className="flex items-center justify-between gap-3 p-3 bg-brand-green/5 border border-brand-green/15 rounded-2xl max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200 select-none mb-3">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                {isAnalyzingImage ? (
                  <Loader2 className="w-4 h-4 text-brand-green animate-spin" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-brand-green" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-sm text-brand-forest font-semibold truncate block">
                  {selectedFile.name}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isAnalyzingImage ? 'text-amber-500 animate-pulse' : 'text-brand-green'}`}>
                  {isAnalyzingImage ? 'Analyzing Image...' : 'Analyzed & Ready'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setAnalyzedImage(null);
              }}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-brand-forest cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Input Bar — Floating pill style inspired by Gemini */}
        <div className="relative bg-gray-50 border border-gray-200/80 rounded-3xl shadow-sm focus-within:border-brand-green/40 focus-within:shadow-[0_0_0_3px_rgba(0,107,63,0.06)] focus-within:bg-white transition-all duration-200">
          <div className="flex items-end gap-2 px-4 py-3">
            
            {/* File Selector */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp"
              className="hidden" 
            />
            <button
              type="button"
              disabled={isSending || isAnalyzingImage}
              onClick={() => {
                if (selectedFile) {
                  setSelectedFile(null);
                  setAnalyzedImage(null);
                } else {
                  fileInputRef.current?.click();
                }
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-brand-green hover:bg-brand-green/8 transition-all cursor-pointer disabled:opacity-50 shrink-0 mb-0.5"
              title={selectedFile ? "Remove image" : "Attach an image"}
            >
              {selectedFile ? (
                <Minus className="w-5 h-5" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </button>
 
            <textarea
              ref={textareaRef}
              required={!selectedFile}
              disabled={isSending || isAnalyzingImage}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={selectedFile ? (isAnalyzingImage ? "Analyzing image..." : "Ask about this image...") : "Ask Braudle anything..."}
              rows={1}
              className="flex-1 resize-none bg-transparent border-none text-[15px] sm:text-[16px] text-brand-forest focus:outline-none placeholder-gray-400/80 font-medium leading-relaxed min-h-[28px] max-h-[120px] overflow-y-auto py-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
 
            <button
              type="submit"
              disabled={isSending || isAnalyzingImage || (!inputText.trim() && !analyzedImage)}
              className="w-9 h-9 rounded-full bg-brand-green text-white hover:bg-brand-forest transition-all disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center mb-0.5 shadow-sm"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {/* Rate limit indicators */}
        {!isSending && (
          <div className="flex justify-between items-center px-4 pt-2.5 select-none">
            <span className="text-[10px] text-gray-400/70 font-medium">
              {Math.max(0, Math.round((remainingTokens / 20000) * 100))}% daily access remaining
            </span>
            {messages.filter(m => m.role === 'user').length > 0 && (
              <span className={`text-[10px] font-medium ${
                messages.filter(m => m.role === 'user').length >= 12 ? 'text-amber-500 animate-pulse' : 'text-gray-400/70'
              }`}>
                {Math.max(0, 15 - messages.filter(m => m.role === 'user').length)} messages left
              </span>
            )}
          </div>
        )}
      </form>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-row bg-white text-brand-forest overflow-hidden h-screen w-screen font-sans">
      
      {/* ────────────────── LEFT SIDEBAR ────────────────── */}
      <aside className={`w-[280px] bg-gray-50 text-brand-forest shrink-0 flex flex-col h-full border-r border-gray-200/60 
        transition-transform duration-300 z-50 absolute md:relative md:translate-x-0
        ${isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between shrink-0">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-forest transition-colors text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpenMobile(false)}
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-brand-forest hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4 shrink-0">
          <button
            onClick={handleCreateSession}
            className="w-full bg-white hover:bg-brand-green/5 border border-gray-200/80 hover:border-brand-green/30 text-brand-forest hover:text-brand-green rounded-2xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search filter */}
        <div className="px-4 pb-3 shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-gray-200/60 focus-within:border-brand-green/40 focus-within:ring-1 focus-within:ring-brand-green/10 rounded-xl text-gray-400 focus-within:text-brand-forest transition-all">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none w-full placeholder-gray-400/70 text-brand-forest"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-2.5 mb-2.5">Recent</p>
          {loadingSessions && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span className="text-xs">Loading chats...</span>
            </div>
          ) : filteredSessions.length === 0 ? (
            <p className="text-xs text-gray-400/80 italic px-3 py-2">No chats found</p>
          ) : (
            filteredSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isEditing = session.id === editingSessionId;

              return (
                <div
                  key={session.id}
                  onClick={() => !isEditing && handleSelectSession(session.id)}
                  className={`group flex items-center justify-between rounded-xl py-2.5 px-3 text-sm transition-all cursor-pointer select-none
                    ${isActive 
                      ? 'bg-white text-brand-forest font-semibold shadow-xs border border-gray-100' 
                      : 'text-gray-600 hover:text-brand-forest hover:bg-white/60'
                    }`}
                >
                  <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-green' : 'text-gray-400'}`} />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') setEditingSessionId(null);
                        }}
                        onBlur={() => handleSaveRename(session.id)}
                        className="bg-white text-brand-forest text-sm border border-brand-green/30 rounded-lg px-2 py-0.5 focus:outline-none w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                      <button
                        onClick={(e) => startRenameSession(session, e)}
                        className="p-1 rounded-lg text-gray-400 hover:text-brand-green hover:bg-brand-green/8 transition-colors"
                        title="Rename Chat"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-gray-200/60 flex items-center gap-3 min-w-0 shrink-0">
          <div className="w-9 h-9 rounded-full bg-brand-green text-white font-black flex items-center justify-center text-sm shrink-0 uppercase">
            {user?.name ? user.name.slice(0, 2) : 'ST'}
          </div>
          <div className="min-w-0 text-left">
            <p className="text-sm font-bold text-brand-forest truncate leading-normal">
              {user?.name || 'Student'}
            </p>
            <p className="text-[10px] text-gray-500 truncate font-medium">
              {user?.email || 'student@braudle.com'}
            </p>
          </div>
        </div>
      </aside>

      {/* Sidebar Backdrop on Mobile */}
      {isSidebarOpenMobile && (
        <div 
          onClick={() => setIsSidebarOpenMobile(false)}
          className="fixed inset-0 bg-brand-charcoal/40 z-40 md:hidden"
        />
      )}

      {/* ────────────────── MAIN CHAT PANEL ────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-white text-brand-forest relative min-w-0 overflow-hidden">
        
        {/* Top Header — Clean & minimal */}
        <header className="px-4 sm:px-6 py-3 flex justify-between items-center shrink-0 select-none border-b border-gray-100/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5">
              {activeSession && activeSession.title !== 'New Chat' ? (
                <h3 className="font-bold text-lg text-brand-forest truncate max-w-[200px] sm:max-w-xs">
                  {activeSession.title}
                </h3>
              ) : (
                <span className="font-semibold text-xl tracking-tight text-brand-green">
                  Braudle
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
            title="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Messages and Central Panel */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto min-h-0 bg-white scrollbar-thin pt-4">
          {loadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
              <p className="text-sm text-gray-400 font-medium">Loading conversation...</p>
            </div>
          ) : messages.length === 0 && !streamingResponse ? (
            /* ═══════ WELCOME SCREEN — Gemini-inspired ═══════ */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-8 sm:py-12 select-none min-h-full">
              

              {/* Large greeting — the hero text */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-brand-forest mb-3 sm:mb-4 animate-in fade-in slide-in-from-bottom-4 duration-600 leading-[1.1]">
                {greeting || 'Where should we start?'}
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-400 font-normal leading-relaxed max-w-lg mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-2 sm:px-0">
                Ask questions, solve problems step-by-step, or upload an image to study.
              </p>

              {/* Input Bar — centered and prominent */}
              <div className="w-full max-w-2xl mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-5 duration-800">
                {renderInputForm()}
              </div>

              {/* Suggestion Cards — 2x2 grid with icons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-900">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleSendMessage(e, item.prompt)}
                    className="flex items-start gap-3.5 p-4 border border-gray-200/70 bg-gray-50/40 rounded-2xl hover:border-brand-green/25 hover:bg-brand-green/[0.03] text-left cursor-pointer transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gray-100/80 group-hover:bg-brand-green/10 flex items-center justify-center shrink-0 text-gray-400 group-hover:text-brand-green transition-colors">
                      {item.icon}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h4 className="text-sm font-bold text-brand-forest mb-0.5 group-hover:text-brand-green truncate transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium leading-normal truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ═══════ ACTIVE CHAT — Message list ═══════ */
            <div className="max-w-3xl mx-auto py-5 sm:py-8 px-4 sm:px-6 space-y-6 sm:space-y-8">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={idx} 
                    className={`flex gap-2.5 sm:gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    {/* AI Avatar */}
                    {!isUser && <BraudleAvatar />}

                    <div className={
                      isUser 
                        ? 'max-w-[85%] sm:max-w-[75%] rounded-3xl px-4 sm:px-5 py-3 sm:py-3.5 text-[15px] sm:text-[16px] md:text-[17px] bg-brand-forest/[0.04] text-brand-forest font-medium leading-relaxed' 
                        : 'flex-1 min-w-0 text-brand-forest pt-1 overflow-x-hidden'
                    }>
                      {/* Render attachments info */}
                      {isUser && msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-3 flex items-center gap-2 bg-brand-green/10 border border-brand-green/15 rounded-xl py-2 px-3 text-xs text-brand-green font-bold max-w-xs truncate">
                          <ImageIcon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{msg.attachments[0].name}</span>
                        </div>
                      )}
                      
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <div className="text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] sm:leading-[1.8] break-words overflow-x-auto">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming AI content */}
              {streamingResponse && (
                <div className="flex gap-2.5 sm:gap-3.5 justify-start animate-in fade-in duration-100">
                  <BraudleAvatar />
                  <div className="flex-1 min-w-0 text-brand-forest pt-1 text-[15px] sm:text-[16px] md:text-[17px] leading-[1.7] sm:leading-[1.8] break-words overflow-x-auto">
                    <MarkdownRenderer content={streamingResponse} />
                  </div>
                </div>
              )}

              {/* Thinking indicator */}
              {isSending && !streamingResponse && (
                <div className="flex gap-2.5 sm:gap-3.5 justify-start animate-in fade-in duration-200">
                  <BraudleAvatar />
                  <ThinkingDots />
                </div>
              )}
            </div>
          )}
        </div>



        {/* ═══════ FLOATING INPUT BAR — at bottom when chat active ═══════ */}
        {(messages.length > 0 || streamingResponse) && (
          <div className="px-3 sm:px-6 pb-4 sm:pb-5 pt-2 sm:pt-3 shrink-0 bg-gradient-to-t from-white via-white to-white/0">
            <div className="max-w-3xl mx-auto w-full">
              {renderInputForm()}
            </div>
          </div>
        )}

      </main>
      
    </div>
  );
}

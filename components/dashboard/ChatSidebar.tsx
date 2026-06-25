'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, X, Trash2, AlertTriangle, Loader2, 
  ImageIcon, Plus, Minus, Search, ArrowLeft, Menu, 
  Edit2, Check, Sparkles, ArrowUp
} from 'lucide-react';
import { api, fetchWithRefresh } from '@/lib/api';
import { useStore } from '@/lib/store';
import MarkdownRenderer from '../tutor/MarkdownRenderer';

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

  // Lock countdown timer removed

  // Scroll to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingResponse]);

  if (!isOpen) return null;

  // Handle selected file checking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImgExt = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(extension || '');
      const isImage = file.type.startsWith('image/') || isImgExt;
      
      if (!isImage) {
        alert('Only image files are allowed in General Chat. PDFs can be studied in your Library.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size exceeds the 10MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const messageToSend = customText !== undefined ? customText : inputText;
    const cleanText = messageToSend.trim();
    if (!cleanText && !selectedFile) return;
    if (isSending || isDailyLocked || isConversationLocked || !activeSessionId) return;

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
    setSelectedFile(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const streamUrl = `${backendUrl}/general-chat/${activeSessionId}/message`;

      const formData = new FormData();
      formData.append('message', cleanText);
      if (backupFile) {
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
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `⚠️ Error: ${err.message || 'Connection failed.'}` }
        ]);
      }
    } finally {
      setIsSending(false);
      setStreamingResponse('');
    }
  };

  // formatLockTime removed

  // Filter sessions by search term
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  // Suggestions for prompt builder
  const promptSuggestions = [
    {
      title: 'Explain a concept',
      description: 'Tell me about photosynthesis in simple terms',
      prompt: 'Can you explain photosynthesis to me step-by-step in simple terms?'
    },
    {
      title: 'Draft study outline',
      description: 'Create a guide for AP Calculus Exam study',
      prompt: 'Help me draft a comprehensive study outline/guide for the AP Calculus exam.'
    },
    {
      title: 'Solve a formula',
      description: 'Show me step-by-step how to solve quadratics',
      prompt: 'Show me step-by-step how to solve a quadratic equation using the quadratic formula.'
    },
    {
      title: 'Brainstorm study topics',
      description: 'Give me active recall ideas for Biology',
      prompt: 'Give me some active recall study question ideas for college Biology.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-row bg-white text-brand-forest overflow-hidden h-screen w-screen font-sans">
      
      {/* ────────────────── LEFT SIDEBAR ────────────────── */}
      <aside className={`w-[280px] bg-white text-brand-forest shrink-0 flex flex-col h-full border-r border-gray-200/80 
        transition-transform duration-300 z-50 absolute md:relative md:translate-x-0
        ${isSidebarOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200/60 shrink-0">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-gray-500 hover:text-brand-forest transition-colors text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
            <span>Library Dashboard</span>
          </button>
          
          <button
            onClick={() => setIsSidebarOpenMobile(false)}
            className="md:hidden p-1 rounded-lg text-gray-400 hover:text-brand-forest hover:bg-gray-100 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 shrink-0">
          <button
            onClick={handleCreateSession}
            className="w-full border border-gray-200 bg-white hover:border-brand-green/30 hover:bg-gray-50 text-brand-forest hover:text-brand-green rounded-xl py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search filter */}
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 focus-within:border-brand-green/55 focus-within:ring-1 focus-within:ring-brand-green/20 rounded-xl text-gray-400 focus-within:text-brand-forest transition-all">
            <Search className="w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none w-full placeholder-gray-400 text-brand-forest"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider px-3 mb-2">Recents</p>
          {loadingSessions && sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400 gap-2">
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span className="text-[11px]">Loading chats...</span>
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
                  className={`group flex items-center justify-between rounded-xl py-2 px-3 text-xs transition-colors cursor-pointer select-none
                    ${isActive 
                      ? 'bg-brand-green/8 text-brand-green font-semibold' 
                      : 'text-gray-600 hover:text-brand-forest hover:bg-gray-100/70'
                    }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1 mr-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-gray-400" />
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
                        className="bg-white text-brand-forest text-xs border border-brand-green/30 rounded px-1 py-0.5 focus:outline-none w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => startRenameSession(session, e)}
                        className="p-0.5 rounded text-gray-400 hover:text-brand-green hover:bg-gray-100 transition-colors"
                        title="Rename Chat"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSession(session.id, e)}
                        className="p-0.5 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Chat"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-gray-200/80 bg-gray-50/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-green text-white font-black flex items-center justify-center text-sm shrink-0 uppercase">
              {user?.name ? user.name.slice(0, 2) : 'ST'}
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-bold text-brand-forest truncate leading-normal">
                {user?.name || 'Student'}
              </p>
              <p className="text-[10px] text-gray-500 truncate font-medium">
                {user?.email || 'student@braudle.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Backdrop on Mobile */}
      {isSidebarOpenMobile && (
        <div 
          onClick={() => setIsSidebarOpenMobile(false)}
          className="fixed inset-0 bg-brand-charcoal/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* ────────────────── MAIN CHAT PANEL ────────────────── */}
      <main className="flex-1 flex flex-col h-full bg-white text-brand-forest relative min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="px-6 py-2.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0 select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="md:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-5.5 h-5.5 bg-brand-green rounded flex items-center justify-center rotate-3 shrink-0">
                <span className="w-2.2 h-2.2 bg-brand-yellow rounded-sm rotate-45" />
              </span>
              <h3 className="font-bold text-base text-brand-forest max-w-[200px] sm:max-w-xs truncate">
                {activeSession && activeSession.title !== 'New Chat' ? activeSession.title : 'Braudle'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 bg-brand-green/10 text-brand-green font-bold rounded-full uppercase tracking-wider">
              Braudle AI
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
              title="Close chat workspace"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages and Central Panel */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 min-h-0 bg-white">
          {loadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-6 h-6 text-brand-green animate-spin" />
              <p className="text-xs text-gray-400 font-medium">Loading session conversation...</p>
            </div>
          ) : messages.length === 0 && !streamingResponse ? (
            /* Welcome / suggestions state */
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-lg mx-auto px-4 py-8 select-none">
              <h2 className="text-3xl md:text-4xl font-extrabold text-brand-forest tracking-tight mb-2">
                Hey {user?.name ? user.name.split(' ')[0] : 'there'}!
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed max-w-sm mb-6 font-medium">
                Let's study and explore something new together today! Ask me any learning questions, solve equations, or upload an image to discuss. We can make it fun and educational!
              </p>

              {/* suggestions builder grid */}
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                {promptSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={(e) => handleSendMessage(e, item.prompt)}
                    className="p-2.5 border border-gray-200/80 bg-gray-50/50 rounded-xl hover:border-brand-green/30 hover:bg-brand-green/5 text-left cursor-pointer transition-all duration-200 group"
                  >
                    <h4 className="text-[11px] font-bold text-brand-forest mb-0.5 group-hover:text-brand-green truncate">
                      {item.title}
                    </h4>
                    <p className="text-[9px] text-gray-400 font-semibold leading-normal truncate">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Active message list */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div 
                    key={idx} 
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                  >
                    <div className={
                      isUser 
                        ? 'max-w-[85%] rounded-2xl p-4 text-sm bg-brand-green/5 border border-brand-green/10 text-brand-forest font-medium' 
                        : 'w-full text-brand-forest py-2 text-sm'
                    }>
                      {/* Render attachments info */}
                      {isUser && msg.attachments && msg.attachments.length > 0 && (
                        <div className="mb-2.5 flex items-center gap-1.5 bg-brand-green/10 border border-brand-green/10 rounded-lg py-1 px-2.5 text-[10px] text-brand-green font-bold max-w-xs truncate">
                          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{msg.attachments[0].name}</span>
                        </div>
                      )}
                      
                      {isUser ? (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Streaming AI content */}
              {streamingResponse && (
                <div className="flex justify-start animate-in fade-in duration-100">
                  <div className="w-full text-brand-forest py-2 text-sm">
                    <MarkdownRenderer content={streamingResponse} />
                  </div>
                </div>
              )}
              
              {/* Messages bottom anchor */}
            </div>
          )}
        </div>

        {/* Daily Token Limit Alert */}
        {isDailyLocked && (
          <div className="max-w-3xl w-full mx-auto px-6 py-6 border border-[#FAD2CF] bg-[#FCE8E6]/60 rounded-2xl mb-4 flex items-start gap-4 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3 text-left">
              <h4 className="font-extrabold text-sm text-rose-800 uppercase tracking-wider">
                Daily access limit reached
              </h4>
              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                You've used all of your AI chat access for now. Come back later when it resets, or upgrade for more AI access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => router.push('/upgrade')}
                  className="bg-[#4A783A] hover:bg-[#3D6330] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
                <button
                  onClick={onClose}
                  className="bg-white border border-[#D1D5C9] text-[#1B3B2B] hover:bg-gray-50 text-xs font-bold py-2 px-4 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Try Again Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Message Limit Alert */}
        {isConversationLocked && !isDailyLocked && (
          <div className="max-w-3xl w-full mx-auto px-6 py-6 border border-[#C2E1A6] bg-[#EDF5E8]/60 rounded-2xl mb-4 flex items-start gap-4 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-3 text-left">
              <h4 className="font-extrabold text-sm text-brand-green uppercase tracking-wider">
                Conversation limit reached
              </h4>
              <p className="text-xs text-brand-green leading-relaxed font-medium">
                You've reached the limit for this conversation. Start a new chat to keep going, or upgrade for longer conversations and more AI access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleCreateSession}
                  className="bg-[#4A783A] hover:bg-[#3D6330] text-white text-xs font-bold py-2 px-4 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Start New Chat
                </button>
                <button
                  onClick={() => router.push('/upgrade')}
                  className="bg-white border border-[#D1D5C9] text-[#1B3B2B] hover:bg-gray-50 text-xs font-bold py-2 px-4 rounded-xl shadow-2xs transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Form Box Area */}
        {!isDailyLocked && !isConversationLocked && (
          <div className="px-6 pb-6 shrink-0 bg-white">
            <div className="max-w-3xl mx-auto w-full">
              <form onSubmit={handleSendMessage} className="space-y-2">
                
                {/* File Upload Preview */}
                {selectedFile && (
                  <div className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 border border-gray-150 rounded-xl max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
                    <div className="flex items-center gap-2 truncate">
                      <ImageIcon className="w-4 h-4 text-brand-green shrink-0" />
                      <span className="text-xs text-brand-forest font-semibold truncate">
                        {selectedFile.name}
                      </span>
                      <div className="flex items-center gap-1 bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-md text-[10px] text-brand-green font-bold shrink-0">
                        <Check className="w-3 h-3" /> Attached
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-brand-forest cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-150 rounded-full py-1.5 px-3 focus-within:border-brand-green focus-within:bg-white focus-within:shadow-2xs transition-all">
                  
                  {/* File Selector (Images only) */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    disabled={isSending}
                    onClick={() => {
                      if (selectedFile) {
                        setSelectedFile(null);
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    className="p-1.5 rounded-full text-gray-400 hover:text-brand-green hover:bg-brand-green/10 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                    title={selectedFile ? "Remove image" : "Attach an image"}
                  >
                    {selectedFile ? (
                      <Minus className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>

                  <textarea
                    required={!selectedFile}
                    disabled={isSending}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={selectedFile ? "Ask a question about this image..." : "Type your study question..."}
                    rows={1}
                    className="flex-1 max-h-24 resize-none bg-transparent border-none text-xs text-brand-forest focus:outline-none placeholder-gray-400 font-medium py-1 min-h-[20px] overflow-y-auto leading-normal"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />

                  <button
                    type="submit"
                    disabled={isSending || (!inputText.trim() && !selectedFile)}
                    className="w-7 h-7 rounded-full bg-brand-green text-white hover:bg-brand-green/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0 flex items-center justify-center"
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                
                {/* Rate limit cycle indicators */}
                {!isSending && (
                  <div className="flex justify-between items-center px-1 select-none">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      Daily AI access: {Math.max(0, Math.round((remainingTokens / 20000) * 100))}% remaining
                    </span>
                    {messages.filter(m => m.role === 'user').length > 0 && (
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        messages.filter(m => m.role === 'user').length >= 12 ? 'text-amber-500 animate-pulse' : 'text-gray-400'
                      }`}>
                        {Math.max(0, 15 - messages.filter(m => m.role === 'user').length)} messages left in this chat
                      </span>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

      </main>
      
    </div>
  );
}

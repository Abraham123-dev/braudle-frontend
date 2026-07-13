'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Loader2, BookOpen, MessageSquare, ArrowDown, HelpCircle, ArrowRight } from 'lucide-react';
import { ChatMessage } from '@/hooks/useSession';
import { fetchWithRefresh } from '@/lib/api';
import MarkdownRenderer from './MarkdownRenderer';
import Logo from '@/components/Logo';

interface PDFAgentChatProps {
  documentId: string;
  sessionId: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  docTitle?: string;
  selectionToExplain: { text: string; timestamp: number } | null;
  onClearSelectionToExplain: () => void;
  onScrollToPage?: (pageNum: number) => void;
  onClose: () => void;
}

export default function PDFAgentChat({
  documentId,
  sessionId,
  messages,
  setMessages,
  docTitle = 'Document',
  selectionToExplain,
  onClearSelectionToExplain,
  onScrollToPage,
  onClose
}: PDFAgentChatProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamError, setStreamError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);

  // Auto-scroll chat history to bottom
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, isStreaming]);

  // Set initial welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: `I am your PDF assistant. I have mapped **${docTitle}** and can help you explain definitions, teach concepts, or answer questions directly from your materials.\n\n💡 **What would you like to study?** Try selecting text inside the PDF on the left, or type a page-specific command (e.g. *"Teach me Page 2"*).`
        }
      ]);
    }
  }, [docTitle, messages.length, setMessages]);

  // Handle highlighted text explanation trigger from parent
  useEffect(() => {
    if (selectionToExplain && selectionToExplain.text.trim()) {
      const prompt = selectionToExplain.text;
      onClearSelectionToExplain();
      handleSendPrompt(`Please explain this highlighted section: "${prompt}"`);
    }
  }, [selectionToExplain]);

  const handleSendPrompt = async (messageText: string) => {
    if (!messageText.trim() || isStreamingRef.current) return;

    // 1. Append user message to log
    const userMsg: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStreamError(null);

    // Detect page scrolling commands (e.g., "go to page 3", "teach me page 5")
    const pageMatch = messageText.match(/(?:go to|scroll to|page)\s*(\d+)/i);
    if (pageMatch && pageMatch[1] && onScrollToPage) {
      const pageNum = parseInt(pageMatch[1], 10);
      onScrollToPage(pageNum);
    }

    // 2. Start streaming response
    isStreamingRef.current = true;
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // If prompt looks like a direct text explanation request
      const isExplain = messageText.startsWith('Please explain this highlighted section:') || messageText.startsWith('Please explain the key concepts on Page');
      const streamUrl = isExplain 
        ? `${backendUrl}/sessions/${sessionId}/explain-selection`
        : `${backendUrl}/sessions/${sessionId}/chat`;

      const reqBody = isExplain
        ? { selectedText: messageText.replace(/^Please explain this highlighted section:\s*"/, '').replace(/"$/, '') }
        : { message: messageText };

      const response = await fetchWithRefresh(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(reqBody)
      });

      if (!response.ok) {
        throw new Error('Failed to connect to tutoring engine.');
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
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          if (cleanLine.startsWith('data: ')) {
            const dataStr = cleanLine.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                accumulatedText += parsed.token;
                
                // Clean suggestions tags out of stream
                let cleanStream = accumulatedText;
                cleanStream = cleanStream.split('[SUGGESTIONS:')[0];
                cleanStream = cleanStream.split('[QUIZ_QUESTION:')[0];
                setStreamingContent(cleanStream);
              }
            } catch (e) {
              // Safe parse
            }
          }
        }
      }

      if (accumulatedText) {
        let cleanText = accumulatedText.split('[SUGGESTIONS:')[0].split('[QUIZ_QUESTION:')[0].trim();
        setMessages(prev => [...prev, { role: 'assistant', content: cleanText }]);
      }
    } catch (err: any) {
      console.error('[PDF CHAT STREAM] Error:', err);
      setStreamError('Connection interrupted. Please verify your connection.');
    } finally {
      setStreamingContent('');
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    handleSendPrompt(input);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-zinc-200/35 rounded-[24px] select-none relative font-sans shadow-sm overflow-hidden">
      <style>{`
        @keyframes shimmer-flow {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-glow {
          background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
          background-size: 200% 100%;
          animation: shimmer-flow 1.5s infinite linear;
        }
        @keyframes wave-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gemini-wave-bar {
          background: linear-gradient(270deg, #4285f4, #9b51e0, #34a853, #fbbc05);
          background-size: 800% 800%;
          animation: wave-gradient 3s ease infinite;
        }
      `}</style>

      {/* Header bar */}
      <div className="px-5 py-4 border-b border-zinc-100/60 flex items-center justify-between shrink-0 font-sans bg-zinc-55/30">
        <div className="flex items-center gap-2.5 select-none">
          <Logo size={22} className="shrink-0" />
          <div className="text-left">
            <h3 className="font-extrabold text-sm text-brand-forest tracking-tight font-sans">Doc Companion</h3>
            <p className="text-[9px] text-brand-green font-bold uppercase tracking-wider font-sans">Active Workspace</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-zinc-400 hover:text-brand-forest hover:bg-zinc-100 transition-all cursor-pointer active:scale-95 animate-in fade-in"
          title="Close PDF chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Chat messages log scroll window */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-5 py-6 space-y-6 scrollbar-thin select-text bg-white"
      >
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
            {msg.role === 'user' ? (
              <div className="max-w-[80%] rounded-[22px] rounded-tr-xs px-4 py-2.5 text-xs font-semibold leading-relaxed bg-zinc-100 text-brand-charcoal border border-zinc-200/20 shadow-3xs font-sans">
                {msg.content}
              </div>
            ) : (
              <div className="flex gap-3 items-start max-w-full overflow-hidden select-text w-full">
                <Logo size={20} className="shrink-0 rounded-lg bg-zinc-50 border border-zinc-100/40 p-0.5 mt-0.5 shadow-3xs" />
                <div className="flex-grow min-w-0 text-brand-forest text-xs leading-relaxed text-left font-sans font-medium space-y-2">
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Streaming text bubble */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start w-full">
            <div className="flex gap-3 items-start max-w-full overflow-hidden select-text w-full">
              <Logo size={20} className="shrink-0 rounded-lg bg-zinc-50 border border-zinc-100/40 p-0.5 mt-0.5 shadow-3xs animate-pulse" />
              <div className="flex-grow min-w-0 text-brand-forest text-xs leading-relaxed text-left relative font-sans font-medium">
                <MarkdownRenderer content={streamingContent} />
                <div className="h-[2px] w-full rounded-full gemini-wave-bar mt-2 animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Shimmer loading skeleton - Gemini style */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3 items-start w-full select-none animate-in fade-in duration-300">
            <Logo size={20} className="shrink-0 rounded-lg bg-zinc-50 border border-zinc-100/40 p-0.5 mt-0.5 shadow-3xs animate-pulse" />
            <div className="flex-grow space-y-2.5 min-w-0">
              <div className="h-3 w-5/6 rounded-full shimmer-glow" />
              <div className="h-3 w-4/5 rounded-full shimmer-glow" />
              <div className="h-3 w-2/3 rounded-full shimmer-glow" />
            </div>
          </div>
        )}

        {/* Stream errors */}
        {streamError && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-[11px] text-red-600 font-semibold leading-relaxed select-none font-sans flex items-center gap-2">
            ⚠️ <span>{streamError}</span>
          </div>
        )}
      </div>

      {/* Floating Input Footer Form */}
      <div className="p-4 shrink-0 bg-white/80 backdrop-blur-md border-t border-zinc-100/50 select-none pb-5 space-y-3.5 animate-in fade-in">
        {/* Suggestion tags */}
        {!isStreaming && messages.length <= 1 && (
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Teach Page 1', text: 'Teach me the concepts on Page 1', icon: <BookOpen className="w-2.5 h-2.5" /> },
              { label: 'Definitions', text: 'List all key definitions from this document', icon: <HelpCircle className="w-2.5 h-2.5" /> },
              { label: 'Summary', text: 'Provide a quick high-level summary of these notes', icon: <Sparkles className="w-2.5 h-2.5" /> }
            ].map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendPrompt(tag.text)}
                className="px-2.5 py-1.5 rounded-xl border border-brand-green/10 bg-brand-green/5 hover:bg-brand-green/10 text-[9px] font-bold text-brand-forest hover:text-brand-forest hover:border-brand-green/20 transition-all duration-200 cursor-pointer flex items-center gap-1 font-sans active:scale-95 shadow-3xs"
              >
                {tag.icon}
                <span>{tag.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input box */}
        <form onSubmit={handleSubmit} className={`relative flex items-center rounded-full px-3.5 py-1.5 transition-all gap-2.5 shadow-2xs border ${isStreaming ? 'bg-zinc-50 border-zinc-100 cursor-not-allowed opacity-60' : 'bg-zinc-50/50 border-zinc-200/60 focus-within:bg-white focus-within:border-brand-green focus-within:ring-1 focus-within:ring-brand-green/10'}`}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask questions about this PDF..."
            className="flex-grow w-full min-w-0 bg-transparent border-none text-xs font-semibold text-brand-forest focus:outline-none placeholder-zinc-400 py-1.5 disabled:cursor-not-allowed font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
              !input.trim() || isStreaming
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-75'
                : 'bg-brand-green text-white hover:bg-brand-green/90 active:scale-95 cursor-pointer shadow-xs'
            }`}
          >
            {isStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5px]" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

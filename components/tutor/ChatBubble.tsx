'use client';

import React from 'react';
import { ChatMessage } from '@/lib/store';

interface ChatBubbleProps {
  message: ChatMessage;
}

export default function ChatBubble({ message }: ChatBubbleProps) {
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 text-xs rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex w-full my-4 ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
          isAssistant
            ? 'bg-white text-zinc-900 border border-zinc-100 rounded-bl-none dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800'
            : 'bg-indigo-600 text-white rounded-br-none dark:bg-indigo-700'
        }`}
      >
        {isAssistant && (
          <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider mb-1 dark:text-indigo-400">
            Tutor (BRAUDLE)
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content || (
            <span className="flex items-center gap-1 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.4s]" />
            </span>
          )}
        </div>
        <div
          className={`text-[9px] mt-1 text-right ${
            isAssistant ? 'text-zinc-400' : 'text-indigo-200'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
    </div>
  );
}

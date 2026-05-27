'use client';

import React, { useState, FormEvent } from 'react';
import { Send, Lightbulb } from 'lucide-react';

interface TutorInputProps {
  onSendMessage: (content: string) => void;
  onTriggerBreakdown?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function TutorInput({
  onSendMessage,
  onTriggerBreakdown,
  disabled = false,
  placeholder = 'Type your response here...',
}: TutorInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSendMessage(input.trim());
    setInput('');
  };

  return (
    <div className="w-full bg-white border-t border-zinc-100 p-4 dark:bg-zinc-950 dark:border-zinc-900">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto items-end">
        {onTriggerBreakdown && (
          <button
            type="button"
            onClick={onTriggerBreakdown}
            disabled={disabled}
            className="flex items-center justify-center p-3 rounded-xl border border-zinc-200 text-zinc-500 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-50/50 transition-all dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-amber-950/20"
            title="Break It Down"
          >
            <Lightbulb className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-600 dark:focus:bg-zinc-950"
          />
        </div>

        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="flex items-center justify-center p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all dark:bg-indigo-700 dark:hover:bg-indigo-800"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

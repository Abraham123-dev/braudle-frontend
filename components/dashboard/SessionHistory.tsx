'use client';

import React from 'react';
import { Calendar, BookOpen, Award, ExternalLink } from 'lucide-react';

export interface HistoryItem {
  id: string;
  documentId: string;
  documentTitle: string;
  topic: string;
  score?: number;
  mode: 'teach' | 'quiz' | 'breakdown';
  date: string;
}

interface SessionHistoryProps {
  history: HistoryItem[];
  onViewSession: (sessionId: string) => void;
}

export default function SessionHistory({ history, onViewSession }: SessionHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-white border border-zinc-100 rounded-2xl p-8 text-center text-zinc-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
        <p className="text-sm">No study sessions logged yet. Pick a document and start learning!</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-4 hover:bg-zinc-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-150 dark:hover:bg-zinc-850/30"
          >
            <div className="flex gap-3 items-start">
              <div className="p-2.5 bg-zinc-50 rounded-xl mt-0.5 dark:bg-zinc-800">
                {item.mode === 'quiz' ? (
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div>
                <h5 className="text-sm font-bold text-zinc-900 line-clamp-1 dark:text-zinc-100">
                  {item.topic}
                </h5>
                <p className="text-xs text-zinc-400 line-clamp-1 dark:text-zinc-500">
                  {item.documentTitle}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-1 dark:text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(item.date).toLocaleDateString()} at{' '}
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="flex gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                  {item.mode}
                </span>
                {item.score !== undefined && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      item.score >= 80
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    Score: {item.score}%
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onViewSession(item.id)}
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Details <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

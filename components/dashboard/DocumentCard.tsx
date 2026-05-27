'use client';

import React from 'react';
import { FileText, Loader2, PlayCircle, BookOpen, AlertCircle } from 'lucide-react';

export interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'image' | 'audio' | 'text';
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  totalChunks: number;
  subject?: string;
  createdAt: string;
}

interface DocumentCardProps {
  doc: Document;
  onStartSession: (docId: string, mode: 'teach' | 'quiz') => void;
}

export default function DocumentCard({ doc, onStartSession }: DocumentCardProps) {
  const isReady = doc.processingStatus === 'ready';
  const isProcessing = doc.processingStatus === 'processing' || doc.processingStatus === 'pending';
  const isFailed = doc.processingStatus === 'failed';

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between dark:bg-zinc-900 dark:border-zinc-800">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-zinc-50 rounded-xl dark:bg-zinc-800">
            <FileText className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
          </div>
          
          {/* Status badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
              isReady
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                : isProcessing
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
            }`}
          >
            {isProcessing && <Loader2 className="w-3 h-3 animate-spin" />}
            {isFailed && <AlertCircle className="w-3 h-3" />}
            {doc.processingStatus}
          </span>
        </div>

        <h4 className="text-sm font-bold text-zinc-900 mb-1 line-clamp-2 dark:text-zinc-100" title={doc.title}>
          {doc.title}
        </h4>
        <p className="text-[11px] text-zinc-400 mb-3 dark:text-zinc-500">
          Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
        </p>

        <div className="flex gap-2 flex-wrap mb-4">
          {doc.subject && (
            <span className="px-2 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-600 rounded dark:bg-zinc-800 dark:text-zinc-400">
              {doc.subject}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-medium bg-indigo-50 text-indigo-600 rounded dark:bg-indigo-950/30 dark:text-indigo-400">
            {doc.totalChunks} chunks
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
        <button
          type="button"
          disabled={!isReady}
          onClick={() => onStartSession(doc.id, 'teach')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all dark:bg-indigo-700 dark:hover:bg-indigo-800"
        >
          <BookOpen className="w-3.5 h-3.5" /> Teach Mode
        </button>
        <button
          type="button"
          disabled={!isReady}
          onClick={() => onStartSession(doc.id, 'quiz')}
          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent transition-all dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-850"
        >
          <PlayCircle className="w-3.5 h-3.5" /> Quiz
        </button>
      </div>
    </div>
  );
}

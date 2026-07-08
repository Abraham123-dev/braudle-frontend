'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import MarkdownRenderer from '@/components/tutor/MarkdownRenderer';

interface SummaryPanelProps {
  loadingSummary: boolean;
  summaryError: string;
  detailedSummary: string;
  docTitle: string;
  fetchDetailedSummary: () => void;
}

export default function SummaryPanel({
  loadingSummary,
  summaryError,
  detailedSummary,
  docTitle,
  fetchDetailedSummary
}: SummaryPanelProps) {
  return (
    <div className="space-y-4 text-left animate-in fade-in duration-200 flex-1 flex flex-col min-h-0">
      <div className="space-y-1 shrink-0">
        <h4 className="font-extrabold text-base text-brand-forest">
          PDF Study Summary
        </h4>
        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
          Comprehensive study guide generated from the textbook/lecture content.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto border border-zinc-200/50 rounded-3xl bg-white p-5 shadow-2xs min-h-[300px]">
        {loadingSummary ? (
          <div className="h-full flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 rounded-full border-4 border-brand-green/20 border-t-brand-green animate-spin" />
            <p className="text-[11px] font-bold text-gray-400">
              Generating study summary from document chunks...
            </p>
          </div>
        ) : summaryError ? (
          <div className="h-full flex flex-col items-center justify-center py-10 space-y-4 text-center text-rose-500">
            <span className="text-sm font-bold">{summaryError}</span>
            <button
              onClick={fetchDetailedSummary}
              className="px-4 py-2 bg-brand-green text-white font-bold text-xs rounded-xl hover:bg-brand-green/95 transition-all cursor-pointer shadow-3xs"
            >
              Retry Summary
            </button>
          </div>
        ) : detailedSummary ? (
          <div className="space-y-6">
            {/* Branded Study Document Cover Card */}
            <div className="bg-brand-yellow rounded-3xl p-6 relative overflow-hidden border border-brand-yellow/30 shadow-3xs select-none">
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
              <div className="text-brand-green font-extrabold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span>Braudle study guide</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-brand-forest tracking-tight leading-tight">
                {docTitle}
              </h2>
              <div className="text-brand-forest/75 text-xs font-bold mt-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                <span>Summarized by Braudle</span>
              </div>
            </div>

            {/* Summary Document Body */}
            <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed font-normal p-1">
              <MarkdownRenderer content={detailedSummary} />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-10 space-y-4 text-center text-gray-400">
            <p className="text-[11px] leading-relaxed max-w-[200px]">
              Summary not generated. Click the button below to initiate generation.
            </p>
            <button
              onClick={fetchDetailedSummary}
              className="px-5 py-2.5 bg-brand-green text-white font-bold text-xs rounded-xl hover:bg-brand-green/95 transition-all cursor-pointer shadow-3xs active:scale-95"
            >
              Generate Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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

      <div className="flex-1 overflow-y-auto min-h-[300px] pr-1">
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
          <div className="flex-grow flex flex-col justify-center gap-6 py-4 animate-in fade-in duration-300">
            <div
              onClick={fetchDetailedSummary}
              className="group relative bg-[#FCFDF9] border border-zinc-200/60 hover:border-brand-green/30 rounded-3xl p-6 text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between min-h-[180px] shadow-2xs"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform animate-pulse">
                  <Sparkles className="w-5 h-5 fill-current" />
                </div>
                <div className="flex-grow min-w-0">
                  <h4 className="font-extrabold text-base text-brand-forest group-hover:text-brand-green transition-colors">
                    Generate study summary
                  </h4>
                  <p className="text-xs text-gray-400 font-normal leading-relaxed mt-1.5 font-sans">
                    Analyze the source note and generate a complete study outline, section definitions, key formulas, and explanations.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700">
                  AI Summarizer
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-brand-green group-hover:underline">
                  Generate &rarr;
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

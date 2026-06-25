'use client';

import React from 'react';
import { Plus, FileText } from 'lucide-react';

interface LeftSidebarProps {
  docTitle: string;
  topics: string[];
  onConceptClick: (concept: string) => void;
  className?: string;
}

export default function LeftSidebar({ docTitle, topics, onConceptClick, className }: LeftSidebarProps) {
  return (
    <aside className={className || "hidden lg:flex w-64 bg-white border border-gray-200/80 shadow-xs rounded-3xl p-6 flex-col justify-between overflow-y-auto shrink-0 select-none text-left"}>
      <div className="space-y-8">
        
        {/* Sources list exactly like NotebookLM */}
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 block">
            Sources
          </label>
          
          <button
            onClick={() => alert('To upload new materials to this Workspace, please add study notes in your Library.')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-dashed border-gray-200 hover:border-brand-green/45 hover:bg-brand-green/5 text-xs font-bold text-gray-500 hover:text-brand-green transition-all cursor-pointer mb-2.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add sources
          </button>

          <div className="flex items-center gap-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl">
            <FileText className="w-4 h-4 text-brand-green shrink-0" />
            <span className="text-xs font-bold text-brand-forest truncate flex-1">
              {docTitle}
            </span>
          </div>
        </div>

        {/* Yellow Highlighted clickable Concepts */}
        {topics.length > 0 && (
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 block">
              Key Concepts
            </label>
            <div className="flex flex-col gap-2">
              {topics.map((topic, idx) => (
                <button 
                  key={idx} 
                  onClick={() => onConceptClick(topic)}
                  className="w-full bg-brand-yellow/15 hover:bg-brand-yellow/30 text-brand-forest font-bold text-xs px-3.5 py-2.5 rounded-xl border border-brand-yellow/20 shadow-2xs text-left cursor-pointer transition-all hover:scale-[1.01]"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Sidebar branding */}
      <div className="pt-6 border-t border-gray-50 flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-400" />
        <span className="text-[10px] text-gray-400 font-semibold tracking-wide uppercase">
          Braudle Workspace
        </span>
      </div>
    </aside>
  );
}

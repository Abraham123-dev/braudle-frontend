'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Award, AlertCircle, MoreVertical, Trash2, X, Check } from 'lucide-react';
import { api } from '@/lib/api';

export interface Document {
  id: string;
  _id?: string;
  title: string;
  type: 'pdf' | 'image' | 'audio' | 'text';
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
  processingStage?: string;
  totalChunks: number;
  subject?: string;
  createdAt: string;
  topics?: string[];
  summary?: string;
}

interface DocumentCardProps {
  doc: Document;
  onStartSession: (docId: string, mode: 'teach' | 'quiz') => void;
  onDeleteSuccess?: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  file_received: 'File received',
  extracting_content: 'Extracting content',
  identifying_concepts: 'Identifying key concepts',
  building_learning_map: 'Building learning map',
  preparing_tutor: 'Preparing AI tutor',
  ready: 'Ready to study!',
  failed: 'Processing failed',
};

export default function DocumentCard({ doc, onStartSession, onDeleteSuccess }: DocumentCardProps) {
  const isReady = doc.processingStatus === 'ready';
  const isProcessing = doc.processingStatus === 'processing' || doc.processingStatus === 'pending';
  const isFailed = doc.processingStatus === 'failed';

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotebookTheme = (subject?: string) => {
    if (!subject) {
      return {
        spineClass: 'bg-teal-700',
        bgClass: 'bg-teal-50/20 hover:bg-teal-50/45 border-teal-100/50',
        tagClass: 'bg-teal-600/10 text-teal-700',
        btnClass: 'bg-teal-700 hover:bg-teal-800'
      };
    }
    const sub = subject.toLowerCase();
    
    // Biology & Life Sciences -> Green
    if (sub.includes('bio') || sub.includes('life') || sub.includes('botany') || sub.includes('zoology')) {
      return {
        spineClass: 'bg-emerald-600',
        bgClass: 'bg-emerald-50/20 hover:bg-emerald-50/45 border-emerald-100/50',
        tagClass: 'bg-emerald-600/10 text-emerald-700',
        btnClass: 'bg-emerald-600 hover:bg-emerald-700'
      };
    }
    
    // Chemistry, Physics & General Science -> Indigo
    if (sub.includes('chem') || sub.includes('phys') || sub.includes('science') || sub.includes('nature')) {
      return {
        spineClass: 'bg-indigo-600',
        bgClass: 'bg-indigo-50/20 hover:bg-indigo-50/45 border-indigo-100/50',
        tagClass: 'bg-indigo-600/10 text-indigo-700',
        btnClass: 'bg-indigo-600 hover:bg-indigo-700'
      };
    }
    
    // Mathematics, Economics & Finance -> Amber
    if (sub.includes('math') || sub.includes('calculus') || sub.includes('econ') || sub.includes('finance') || sub.includes('accounting')) {
      return {
        spineClass: 'bg-amber-500',
        bgClass: 'bg-amber-50/15 hover:bg-amber-50/35 border-amber-100/40',
        tagClass: 'bg-amber-600/10 text-amber-700',
        btnClass: 'bg-amber-500 hover:bg-amber-600'
      };
    }
    
    // History, Arts, Literature -> Violet
    if (sub.includes('hist') || sub.includes('art') || sub.includes('lit') || sub.includes('lang') || sub.includes('english') || sub.includes('social')) {
      return {
        spineClass: 'bg-violet-600',
        bgClass: 'bg-violet-50/20 hover:bg-violet-50/45 border-violet-100/50',
        tagClass: 'bg-violet-600/10 text-violet-700',
        btnClass: 'bg-violet-600 hover:bg-violet-700'
      };
    }

    // Default / General -> Teal
    return {
      spineClass: 'bg-teal-700',
      bgClass: 'bg-teal-50/20 hover:bg-teal-50/45 border-teal-100/50',
      tagClass: 'bg-teal-600/10 text-teal-700',
      btnClass: 'bg-teal-700 hover:bg-teal-800'
    };
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(true);
    try {
      const docId = doc.id || doc._id || '';
      await api.delete(`/documents/${docId}`);
      setMenuOpen(false);
      setConfirmDelete(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      alert(`Failed to delete notebook: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  const getStageText = () => {
    if (doc.processingStage && STAGE_LABELS[doc.processingStage]) {
      return STAGE_LABELS[doc.processingStage];
    }
    return 'Analyzing document...';
  };

  const theme = getNotebookTheme(doc.subject);

  return (
    <div className={`relative bg-white border border-gray-100 ${theme.bgClass} rounded-3xl pl-9 pr-6 py-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[220px] overflow-hidden group`}>
      
      {/* ── Visual Notebook Spine & Cover Crease ── */}
      <div className={`absolute left-0 top-0 bottom-0 w-3.5 ${theme.spineClass} z-10`} />
      <div className="absolute left-4.5 top-0 bottom-0 w-px bg-black/5 z-10" />

      <div>
        {/* Top Header: tags & context action */}
        <div className="flex justify-between items-start mb-4 relative z-20">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${theme.tagClass}`}>
            {doc.subject || 'General'}
          </span>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 font-semibold">
              {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            
            {/* Options Trigger (Three dots) */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                  setConfirmDelete(false);
                }}
                className="p-1 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-forest transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {/* Context Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in duration-100">
                  {!confirmDelete ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 flex items-center gap-2 text-left cursor-pointer"
                      disabled={deleting}
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" />
                      Delete Notebook
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 text-left">Confirm Deletion?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] flex items-center justify-center cursor-pointer"
                        >
                          {deleting ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(false);
                          }}
                          disabled={deleting}
                          className="flex-1 py-1 rounded border border-gray-100 hover:bg-gray-50 text-gray-500 font-bold text-[10px] flex items-center justify-center cursor-pointer"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-brand-forest mb-2 line-clamp-2 leading-snug text-left" title={doc.title}>
          {doc.title}
        </h3>

        {/* Subtext info */}
        {isReady && (
          <p className="text-[11px] text-gray-400 font-medium text-left">
            {doc.topics && doc.topics.length > 0 
              ? `${doc.topics.length} study` 
              : `${doc.totalChunks || 1} study`}
          </p>
        )}

        {/* Processing State */}
        {isProcessing && (
          <div className="space-y-2 mt-4 text-left">
            <p className="text-[10px] font-bold text-brand-forest/50 flex items-center gap-1.5">
              {getStageText()}
            </p>
            <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${theme.spineClass}`}
                style={{ 
                  width: doc.processingStage === 'file_received' ? '16%' :
                         doc.processingStage === 'extracting_content' ? '33%' :
                         doc.processingStage === 'identifying_concepts' ? '50%' :
                         doc.processingStage === 'building_learning_map' ? '66%' :
                         doc.processingStage === 'preparing_tutor' ? '83%' : '8%'
                }}
              />
            </div>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-1.5 text-rose-600 text-[10px] font-bold mt-4 text-left">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Analysis failed</span>
          </div>
        )}
      </div>

      {/* Quick Launch Buttons (Only visible when ready) */}
      {isReady && (
        <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-gray-50/50">
          <button
            type="button"
            onClick={() => onStartSession(doc.id || doc._id || '', 'teach')}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer active:scale-[0.98] ${theme.btnClass}`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Study
          </button>
          <button
            type="button"
            onClick={() => onStartSession(doc.id || doc._id || '', 'quiz')}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border border-gray-200 text-brand-forest hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]"
          >
            <Award className="w-3.5 h-3.5" /> Practice
          </button>
        </div>
      )}
    </div>
  );
}

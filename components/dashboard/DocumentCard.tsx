'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, AlertCircle, MoreVertical, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

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
  identifying_concepts: 'Identifying concepts',
  building_learning_map: 'Mapping learning path',
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

  // Close dropdown on click outside
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
        bgClass: 'bg-[#EEF1F8] hover:bg-[#E4E9F4] border border-[#EEF1F8]/10',
        iconBg: 'bg-[#DFE4F2] text-brand-forest',
        spineClass: 'bg-brand-green'
      };
    }
    const sub = subject.toLowerCase();
    
    // Biology & Life Sciences -> soft emerald-green
    if (sub.includes('bio') || sub.includes('life') || sub.includes('botany') || sub.includes('zoology')) {
      return {
        bgClass: 'bg-[#ECFDFC]/75 hover:bg-[#E4FBF9] border border-[#ECFDFC]/10',
        iconBg: 'bg-[#D6F7F5] text-brand-green',
        spineClass: 'bg-emerald-500'
      };
    }
    
    // Chemistry, Physics & General Science -> soft purple-pink
    if (sub.includes('chem') || sub.includes('phys') || sub.includes('science') || sub.includes('nature')) {
      return {
        bgClass: 'bg-[#F5EFF3]/75 hover:bg-[#F0E8EC] border border-[#F5EFF3]/10',
        iconBg: 'bg-[#EADEE6] text-rose-500',
        spineClass: 'bg-indigo-500'
      };
    }
    
    // Mathematics, Economics & Finance -> soft amber-orange
    if (sub.includes('math') || sub.includes('calculus') || sub.includes('econ') || sub.includes('finance') || sub.includes('accounting')) {
      return {
        bgClass: 'bg-[#FFF9E6]/75 hover:bg-[#FFF3CD] border border-[#FFF9E6]/10',
        iconBg: 'bg-[#FFF0B3] text-amber-600',
        spineClass: 'bg-amber-500'
      };
    }
    
    // History, Arts, Literature -> soft violet-blue
    if (sub.includes('hist') || sub.includes('art') || sub.includes('lit') || sub.includes('lang') || sub.includes('english') || sub.includes('social')) {
      return {
        bgClass: 'bg-[#EEF1F8]/75 hover:bg-[#E4E9F4] border border-[#EEF1F8]/10',
        iconBg: 'bg-[#DFE4F2] text-[#5F6368]',
        spineClass: 'bg-purple-500'
      };
    }

    // Default -> soft purple-blue
    return {
      bgClass: 'bg-[#EEF1F8] hover:bg-[#E4E9F4] border border-[#EEF1F8]/10',
      iconBg: 'bg-[#DFE4F2] text-brand-forest',
      spineClass: 'bg-brand-green'
    };
  };

  const handleCardClick = () => {
    if (isReady) {
      onStartSession(doc.id || doc._id || '', 'teach');
    }
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
      toast.error('Failed to delete notebook. Please try again.');
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
    <>
      {/* Mobile View: Horizontal list row */}
      <div 
        onClick={handleCardClick}
        className="flex sm:hidden flex-col w-full p-4 rounded-[16px] border border-gray-100 bg-white hover:bg-zinc-50/50 transition-all select-none cursor-pointer active:scale-[0.99] relative overflow-hidden"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Subject icon */}
            <div className={`w-9.5 h-9.5 rounded-full ${theme.iconBg} flex items-center justify-center shrink-0`}>
              {doc.subject && (doc.subject.toLowerCase().includes('phys') || doc.subject.toLowerCase().includes('chem')) ? (
                <svg className="w-5 h-5 text-orange-500 fill-current" viewBox="0 0 24 24">
                  <path d="M11.5 2C11.5 2 12.3 8.3 12.3 8.3L19 9.5L12.3 10.7L11.5 17L10.7 10.7L4 9.5L10.7 8.3L11.5 2Z" />
                </svg>
              ) : (
                <BookOpen className="w-4.5 h-4.5 text-[#5F6368]" />
              )}
            </div>

            {/* Title & Metadata */}
            <div className="text-left min-w-0 flex-1 pr-2">
              <h3 className="text-[13px] font-bold text-brand-forest leading-snug truncate" title={doc.title}>
                {doc.title}
              </h3>
              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                {doc.subject ? `${doc.subject} · ` : ''}
                {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setConfirmDelete(false);
              }}
              className="p-1.5 rounded-full hover:bg-black/5 text-gray-400 hover:text-brand-forest transition-all cursor-pointer"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-100">
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

        {/* Processing Indicator for Mobile */}
        {isProcessing && (
          <div className="mt-3 flex items-center gap-2 pt-2 border-t border-zinc-100/50">
            <span className="text-[9px] font-bold text-brand-green/80 animate-pulse flex-1">
              {getStageText()}
            </span>
            <div className="w-20 bg-black/5 h-1 rounded-full overflow-hidden shrink-0">
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
          <span className="text-rose-600 text-[9px] font-bold mt-2 pt-1.5 border-t border-zinc-100/50 block">
            Analysis failed
          </span>
        )}
      </div>

      {/* Desktop View: Notebook grid card */}
      <div 
        onClick={handleCardClick}
        className={`hidden sm:flex group relative flex-col justify-between p-5 rounded-2xl transition-all duration-200 cursor-pointer select-none aspect-[1.35/1] sm:aspect-[1.4/1] shadow-2xs hover:shadow-xs hover:scale-[1.01] ${theme.bgClass}`}
      >
        {/* Top Row: Icon & Context Menu */}
        <div className="flex justify-between items-start w-full relative z-10">
          <div className={`w-9.5 h-9.5 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
            {doc.subject && (doc.subject.toLowerCase().includes('phys') || doc.subject.toLowerCase().includes('chem')) ? (
              <svg className="w-5 h-5 text-orange-500 fill-current" viewBox="0 0 24 24">
                <path d="M11.5 2C11.5 2 12.3 8.3 12.3 8.3L19 9.5L12.3 10.7L11.5 17L10.7 10.7L4 9.5L10.7 8.3L11.5 2Z" />
              </svg>
            ) : (
              <BookOpen className="w-4.5 h-4.5 text-[#5F6368]" />
            )}
          </div>

          <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
                setConfirmDelete(false);
              }}
              className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 hover:text-brand-forest transition-all cursor-pointer animate-in fade-in"
              title="Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-2 duration-100">
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

        {/* Bottom Row: Title and Details */}
        <div className="text-left w-full mt-4 min-w-0">
          <h3 className="text-sm font-bold text-brand-forest leading-snug truncate pr-2 group-hover:text-brand-green transition-colors duration-200" title={doc.title}>
            {doc.title}
          </h3>
          
          {isReady && (
            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              {new Date(doc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {doc.topics && doc.topics.length > 0 ? `${doc.topics.length} source topics` : `${doc.totalChunks || 1} sources`}
            </p>
          )}

          {isProcessing && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[9px] font-bold text-brand-green/80 animate-pulse">
                {getStageText()}
              </span>
              <div className="w-16 bg-black/5 h-1 rounded-full overflow-hidden shrink-0">
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
            <span className="text-rose-600 text-[9px] font-bold mt-1.5 block">
              Analysis failed
            </span>
          )}
        </div>
      </div>
    </>
  );
}

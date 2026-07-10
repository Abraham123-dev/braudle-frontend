'use client';

import React from 'react';
import { 
  BookOpen, 
  FileQuestion, 
  Award, 
  FileText, 
  ChevronRight, 
  MoreVertical,
  BookOpen as FlashcardsIcon
} from 'lucide-react';

interface SavedNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface StudioPanelProps {
  isProcessingDoc: boolean;
  combinedItems: any[];
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupId: string) => void;
  setSelectedNote: (note: SavedNote | null) => void;
  handleLoadSavedQuiz: (quiz: any) => void;
  setSelectedFlashcardDeckId: (deckId: string) => void;
  setCurrentFlashcardIdx: React.Dispatch<React.SetStateAction<number>>;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  setRightPanelTab: React.Dispatch<React.SetStateAction<'studio' | 'quiz' | 'flashcards' | 'summary'>>;
  setActiveMobileTab: React.Dispatch<React.SetStateAction<'sources' | 'chat' | 'studio'>>;
  setShowRightPane: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAddNoteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsExamSession: React.Dispatch<React.SetStateAction<boolean>>;
  setQuiz: React.Dispatch<React.SetStateAction<any>>;
  setQuizResult: React.Dispatch<React.SetStateAction<any>>;
  dueCount?: number;
  knowledgeCacheStatus?: string;
}

export default function StudioPanel({
  isProcessingDoc,
  combinedItems,
  expandedGroups,
  toggleGroup,
  setSelectedNote,
  handleLoadSavedQuiz,
  setSelectedFlashcardDeckId,
  setCurrentFlashcardIdx,
  setIsFlipped,
  setRightPanelTab,
  setActiveMobileTab,
  setShowRightPane,
  setIsAddNoteOpen,
  setIsExamSession,
  setQuiz,
  setQuizResult,
  dueCount,
  knowledgeCacheStatus
}: StudioPanelProps) {

  // Time ago helper for styling
  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  const isCachePending = ['pending', 'processing'].includes(knowledgeCacheStatus || 'pending');

  const studioCards = [
    {
      id: 'flashcards',
      label: 'Flashcards',
      bg: 'bg-rose-50/60 hover:bg-rose-100/50 border-rose-150/10',
      iconBg: 'bg-rose-500/10 text-rose-700',
      icon: FlashcardsIcon,
      onClick: () => {
        setSelectedFlashcardDeckId('new');
        setRightPanelTab('flashcards');
      },
      badge: dueCount && dueCount > 0 ? `${dueCount} due` : undefined,
      disabled: isCachePending
    },
    {
      id: 'quiz',
      label: 'Quiz',
      bg: 'bg-blue-50/60 hover:bg-blue-100/50 border-blue-150/10',
      iconBg: 'bg-blue-500/10 text-blue-700',
      icon: FileQuestion,
      onClick: () => {
        setIsExamSession(false);
        setRightPanelTab('quiz');
        setQuiz(null);
        setQuizResult(null);
      },
      disabled: isCachePending
    },
    {
      id: 'examprep',
      label: 'Exam Prep',
      bg: 'bg-amber-50/60 hover:bg-amber-100/50 border-amber-150/10',
      iconBg: 'bg-amber-500/10 text-amber-700',
      icon: Award,
      onClick: () => {
        setIsExamSession(true);
        setRightPanelTab('quiz');
        setQuiz(null);
        setQuizResult(null);
      },
      disabled: isCachePending
    },
    {
      id: 'summary',
      label: 'PDF Summary',
      bg: 'bg-emerald-50/60 hover:bg-emerald-100/50 border-emerald-150/10',
      iconBg: 'bg-emerald-500/10 text-emerald-700',
      icon: FileText,
      onClick: () => {
        setRightPanelTab('summary');
      },
      disabled: false
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
      
      {/* Grid of study guides */}
      <div>
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50 mb-3">
          Study Guide Generators
        </h4>
        
        <div className="grid grid-cols-2 gap-2.5">
          {studioCards.map((card) => (
            <button
              key={card.id}
              onClick={() => card.onClick?.()}
              disabled={isProcessingDoc || card.disabled}
              className={`p-3.5 rounded-2xl border border-transparent ${card.bg} text-left transition-all cursor-pointer group flex flex-col justify-between disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:shadow-xs active:scale-[0.98] w-full min-h-[85px]`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center group-hover:scale-105 transition-all shrink-0 relative`}>
                  <card.icon className="w-4 h-4" />
                  {card.badge && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {card.badge && (
                    <span className="text-[9px] font-black text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-full uppercase tracking-wider scale-90">
                      {card.badge}
                    </span>
                  )}
                  {card.disabled && !isProcessingDoc ? (
                    <span className="text-[9px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 scale-95 animate-pulse">
                      <svg className="animate-spin h-2.5 w-2.5 text-zinc-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Preparing...
                    </span>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/70 hover:bg-white flex items-center justify-center text-gray-400 group-hover:text-brand-green group-hover:scale-105 transition-all shrink-0 shadow-3xs">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
              <span className="font-extrabold text-[12px] text-brand-forest leading-tight mt-3.5 truncate block">
                {card.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Study Guides & Notes Section */}
      <div className="border-t border-gray-150/40 pt-5 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/50">
            Saved Study Guides & Notes
          </h4>
          <button
            onClick={() => setIsAddNoteOpen(true)}
            disabled={isProcessingDoc}
            className="px-2.5 py-1 rounded-lg bg-brand-green text-white text-[10px] font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add Note
          </button>
        </div>

        {combinedItems.length === 0 ? (
          <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 lg:flex-1 flex items-center justify-center animate-in fade-in">
            <p className="text-[11px] leading-relaxed max-w-[200px]">
              No guides or notes saved yet. Generate a quiz or write a note to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-2 lg:overflow-y-auto pr-1 lg:flex-1 lg:min-h-0">
            {combinedItems.map((item) => {
              const isNote = item.type === 'note';
              if (isNote) {
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNote(item.raw)}
                    className="py-2.5 px-2 flex items-center justify-between group/saved-item cursor-pointer hover:bg-zinc-50 rounded-xl transition-all animate-in fade-in"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-500">
                        <FileText className="w-5 h-5 stroke-[2px]" />
                      </div>
                      <div className="text-left min-w-0">
                        <span className="font-semibold text-xs text-brand-forest block truncate group-hover/saved-item:text-brand-green transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          1 source · {formatTimeAgo(item.date)}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              const isQuizGrp = item.type === 'quiz-group';
              const isExamGrp = item.type === 'exam-group';
              const iconColor = isQuizGrp 
                ? 'text-blue-600' 
                : isExamGrp 
                  ? 'text-amber-600' 
                  : 'text-rose-600';
              const isExpanded = !!expandedGroups[item.id];

              return (
                <div key={item.id} className="space-y-0.5 animate-in fade-in duration-200">
                  <div
                    onClick={() => toggleGroup(item.id)}
                    className="py-2.5 px-2 flex items-center justify-between group/saved-item cursor-pointer hover:bg-zinc-50 rounded-xl transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`w-5 h-5 flex items-center justify-center shrink-0 ${iconColor}`}>
                        {isQuizGrp ? (
                          <FileQuestion className="w-5 h-5 stroke-[2px]" />
                        ) : isExamGrp ? (
                          <Award className="w-5 h-5 stroke-[2px]" />
                        ) : (
                          <BookOpen className="w-5 h-5 stroke-[2px]" />
                        )}
                      </div>
                      <div className="text-left min-w-0">
                        <span className="font-semibold text-xs text-brand-forest block truncate group-hover/saved-item:text-brand-green transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleGroup(item.id);
                      }}
                      className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors shrink-0"
                    >
                      <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-4.5 border-l border-zinc-200/40 pl-3.5 space-y-1 mt-0.5 mb-2 animate-in slide-in-from-top-1 duration-150">
                      {item.items.map((sub: any, sIdx: number) => {
                        return (
                          <div
                            key={sub.id}
                            onClick={() => {
                              if (isQuizGrp || isExamGrp) {
                                handleLoadSavedQuiz(sub.raw);
                              } else {
                                setSelectedFlashcardDeckId(item.items[sIdx].id);
                                setCurrentFlashcardIdx(0);
                                setIsFlipped(false);
                                setRightPanelTab('flashcards');
                                setActiveMobileTab('studio');
                                setShowRightPane(true);
                              }
                            }}
                            className="py-2 px-2 flex items-center justify-between group/sub-item cursor-pointer hover:bg-zinc-55 rounded-lg transition-all"
                          >
                            <div className="flex flex-col text-left min-w-0 pr-2">
                              <span className="font-semibold text-[11px] text-brand-forest/90 group-hover/sub-item:text-brand-green transition-colors">
                                {sub.title}
                              </span>
                              <span className="text-[9px] text-zinc-400 block mt-0.5">
                                {sub.subtitle} · {formatTimeAgo(sub.date)}
                              </span>
                            </div>
                            <ChevronRight className="w-3 h-3 text-zinc-350 group-hover/sub-item:text-brand-green transition-all" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

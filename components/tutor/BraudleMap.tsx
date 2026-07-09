'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  ChevronRight, 
  BookOpen, 
  FileQuestion, 
  MessageSquare,
  Network,
  RotateCcw,
  Sliders,
  X
} from 'lucide-react';

interface Concept {
  id: string;
  name: string;
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  summary?: string;
  concepts: Concept[];
}

interface ConceptMapData {
  title: string;
  chapters: Chapter[];
}

interface BraudleMapProps {
  documentId: string;
  onAskTutor: (conceptName: string) => void;
  onGenerateQuiz: (conceptName: string, numQuestions: number, difficulty: string) => void;
  onStudyFlashcards: (conceptName: string) => void;
}

export default function BraudleMap({
  documentId,
  onAskTutor,
  onGenerateQuiz,
  onStudyFlashcards
}: BraudleMapProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<ConceptMapData | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  // Local Quiz configuration state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizQuestionsCount, setQuizQuestionsCount] = useState<number>(5);
  const [quizDifficulty, setQuizDifficulty] = useState<string>('medium');

  // Scrolling container ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch map data
  const fetchConceptMap = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/documents/${documentId}/concept-map`);
      if (res && res.conceptMap) {
        setMapData(res.conceptMap);
        if (res.conceptMap.chapters?.length > 0) {
          setSelectedChapterId(res.conceptMap.chapters[0].id);
        }
      } else {
        throw new Error('Failed to load knowledge map data.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate visual syllabus map.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConceptMap();
  }, [documentId]);

  const scrollToChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    const element = document.getElementById(`chapter-${chapterId}`);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const offsetTop = element.offsetTop - container.offsetTop - 16;
      container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const handleStartQuiz = () => {
    if (selectedConcept) {
      onGenerateQuiz(selectedConcept.name, quizQuestionsCount, quizDifficulty);
      setShowQuizModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 flex-1 h-full min-h-[300px]">
        <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center animate-spin">
          <Network className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-brand-forest">
            Analyzing document structure...
          </h4>
          <p className="text-[10px] text-gray-400 font-semibold max-w-[240px]">
            The AI is mapping concepts, identifying chapters, and drawing connections. This takes only a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 flex-1 h-full min-h-[300px]">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-extrabold text-sm text-brand-forest">
            Couldn't load knowledge map
          </h4>
          <p className="text-[10px] text-gray-400 font-semibold max-w-xs leading-relaxed">
            {error}
          </p>
        </div>
        <button
          onClick={fetchConceptMap}
          className="px-3.5 py-1.5 bg-brand-green text-white text-xs font-bold rounded-xl hover:bg-brand-green/90 transition-all cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div 
      className="relative flex flex-col md:flex-row h-full w-full select-none text-left overflow-hidden min-h-0 bg-[#F6F7F2]"
      style={{
        backgroundImage: 'radial-gradient(#E2E6DD 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* CHAPTERS INDEX SIDEBAR (Desktop) */}
      <div className="hidden md:flex w-64 border-r border-[#E2E6DD]/65 bg-[#FBFBFA]/90 backdrop-blur-xs flex-col max-h-full overflow-y-auto shrink-0 p-5 gap-3.5 z-10">
        <div className="space-y-1 pb-4 border-b border-zinc-200/40">
          <span className="text-[8px] font-black text-brand-green uppercase tracking-widest block">
            Outline Index
          </span>
          <h3 className="font-black text-[12px] text-brand-forest leading-snug truncate" title={mapData?.title}>
            {mapData?.title}
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black text-brand-forest/40 uppercase tracking-widest block mb-1">
            Chapters & Sections
          </span>
          {mapData?.chapters.map((chapter) => {
            const isSelected = chapter.id === selectedChapterId;
            return (
              <button
                key={chapter.id}
                onClick={() => scrollToChapter(chapter.id)}
                className={`w-full p-3 rounded-2xl text-left border transition-all duration-300 relative group active:scale-[0.98] shadow-3xs ${
                  isSelected
                    ? 'bg-gradient-to-br from-white to-[#F0F2EB] border-[#3D5F30] text-brand-forest shadow-xs'
                    : 'bg-white/85 border-zinc-200/60 text-brand-forest/80 hover:bg-white hover:border-zinc-300'
                }`}
              >
                <h4 className="font-extrabold text-[11px] leading-snug line-clamp-2 pr-3">
                  {chapter.title}
                </h4>
                {isSelected && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#3D5F30]/10 text-[#3D5F30] flex items-center justify-center">
                    <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE HORIZONTAL CHAPTERS TAB BAR */}
      <div className="flex md:hidden w-full items-center gap-2 overflow-x-auto px-4 py-3 bg-[#FBFBFA]/90 border-b border-[#E2E6DD]/60 shrink-0 z-10 scrollbar-none">
        {mapData?.chapters.map((chapter) => {
          const isSelected = chapter.id === selectedChapterId;
          return (
            <button
              key={chapter.id}
              onClick={() => scrollToChapter(chapter.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all duration-200 active:scale-95 ${
                isSelected
                  ? 'bg-[#3D5F30] border-[#3D5F30] text-white shadow-3xs'
                  : 'bg-white border-zinc-200/60 text-brand-forest/80'
              }`}
            >
              {chapter.title.split(':')[0]}
            </button>
          );
        })}
      </div>

      {/* CENTER TIMELINE ROADMAP CANVAS */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-6 py-8 md:px-12 relative scroll-smooth h-full z-0 pb-36"
      >
        {mapData?.chapters.map((chapter) => (
          <div 
            key={chapter.id} 
            id={`chapter-${chapter.id}`} 
            className="mb-10 last:mb-16 scroll-mt-6"
          >
            {/* Chapter Header Card */}
            <div className="flex items-center gap-3 mb-6 bg-white/50 border border-zinc-200/40 rounded-2xl p-3 max-w-fit shadow-3xs backdrop-blur-xs">
              <div className="px-2.5 py-1 rounded-lg bg-brand-green/10 text-[#3D5F30] text-[9px] font-black uppercase tracking-wider">
                {chapter.title.split(':')[0]}
              </div>
              <h3 className="font-extrabold text-[12px] text-brand-forest">
                {chapter.title.includes(':') ? chapter.title.split(':').slice(1).join(':').trim() : chapter.title}
              </h3>
            </div>
            
            {/* Socratic Concept Roadmap (Timeline style) */}
            <div className="relative pl-9 ml-4 space-y-6">
              {/* Vertical SVG connection line */}
              <div className="absolute left-[7px] top-3 bottom-3 w-[2px] pointer-events-none">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <line 
                    x1="1" y1="0" x2="1" y2="100%" 
                    stroke="#8BA476" 
                    strokeWidth="2" 
                    strokeDasharray="6,4" 
                    className="opacity-50"
                  />
                </svg>
              </div>

              {chapter.concepts.map((concept) => {
                const isConceptSelected = selectedConcept?.id === concept.id;
                return (
                  <div key={concept.id} className="relative group text-left">
                    {/* Node Dot Connector */}
                    <div 
                      className={`absolute -left-[41px] top-[22px] w-5 h-5 rounded-full border-4 transition-all duration-300 z-10 ${
                        isConceptSelected 
                          ? 'border-[#3D5F30]/25 bg-[#3D5F30] scale-110 shadow-sm' 
                          : 'border-[#F6F7F2] bg-[#8BA476] group-hover:bg-[#3D5F30] group-hover:scale-105'
                      }`}
                    />

                    {/* Active SVG Horizontal Connector Line */}
                    {isConceptSelected && (
                      <div className="absolute left-[-21px] top-[31px] w-[21px] h-[2px] pointer-events-none hidden sm:block">
                        <svg className="w-full h-full">
                          <line 
                            x1="0" y1="1" x2="100%" y2="1" 
                            stroke="#3D5F30" 
                            strokeWidth="2" 
                            strokeDasharray="4,2" 
                            className="animate-pulse"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Roadmap Concept Node Card */}
                    <button
                      type="button"
                      onClick={() => setSelectedConcept(concept)}
                      className={`w-full max-w-2xl p-4 rounded-2xl border text-left transition-all duration-300 active:scale-[0.99] flex flex-col justify-between relative overflow-hidden shadow-3xs group-hover:shadow-2xs ${
                        isConceptSelected
                          ? 'bg-gradient-to-br from-white to-[#FCFDF9] border-[#3D5F30] text-brand-forest shadow-xs'
                          : 'bg-white border-zinc-200/60 text-brand-forest hover:bg-white hover:border-zinc-300'
                      }`}
                    >
                      {isConceptSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#3D5F30]" />
                      )}
                      
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[12px] text-brand-forest leading-snug line-clamp-1 transition-colors duration-200 group-hover:text-[#3D5F30]">
                          {concept.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed line-clamp-2">
                          {concept.explanation}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100/60 w-full justify-between select-none">
                        <span className="text-[8px] font-black text-[#8BA476] bg-[#3D5F30]/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Concept Node
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-all ${isConceptSelected ? 'text-brand-green translate-x-0.5' : ''}`} />
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM CONCEPT DETAIL DRAWER OVERLAY */}
      {selectedConcept && (
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 p-4.5 md:p-5 bg-white/95 backdrop-blur-md border border-zinc-200/80 rounded-3xl shadow-lg z-20 animate-in slide-in-from-bottom-4 duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 text-left max-w-xl flex-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <h4 className="font-black text-[12.5px] text-brand-forest">
                {selectedConcept.name}
              </h4>
            </div>
            <p className="text-[10.5px] md:text-[11px] text-gray-400 font-semibold leading-relaxed">
              {selectedConcept.explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => onAskTutor(selectedConcept.name)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-[#3D5F30] hover:bg-[#1A2C18] text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-lime" />
              <span>Ask Braudle</span>
            </button>
            <button
              onClick={() => onStudyFlashcards(selectedConcept.name)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100/60 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setShowQuizModal(true)}
              className="flex-1 md:flex-initial px-4 py-2.5 bg-blue-50 hover:bg-blue-100/60 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>
          </div>
        </div>
      )}

      {/* QUIZ OPTIONS OVERLAY MODAL */}
      {showQuizModal && selectedConcept && (
        <div className="absolute inset-0 bg-brand-forest/20 backdrop-blur-xs flex items-center justify-center p-4 z-30 animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-250/60 rounded-3xl shadow-xl max-w-sm w-full p-6 space-y-6 animate-in zoom-in-95 duration-200 text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Sliders className="w-4 h-4" />
                </div>
                <h4 className="font-extrabold text-xs text-brand-forest uppercase tracking-wider">
                  Quiz Configuration
                </h4>
              </div>
              <button 
                onClick={() => setShowQuizModal(false)}
                className="p-1 text-gray-400 hover:text-brand-forest rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Options container */}
            <div className="space-y-4">
              {/* Question Count Selection */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                  How many questions?
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 5, 10, 15].map((count) => {
                    const isSel = quizQuestionsCount === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuizQuestionsCount(count)}
                        className={`py-2 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-[#3D5F30] border-[#3D5F30] text-white' 
                            : 'bg-white border-zinc-200 text-brand-forest hover:bg-gray-50'
                        }`}
                      >
                        {count} Qs
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty Selection */}
              <div className="space-y-2">
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">
                  Difficulty Level
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'easy', label: 'Easy' },
                    { key: 'medium', label: 'Medium' },
                    { key: 'hard', label: 'Hard' }
                  ].map((diff) => {
                    const isSel = quizDifficulty === diff.key;
                    return (
                      <button
                        key={diff.key}
                        type="button"
                        onClick={() => setQuizDifficulty(diff.key)}
                        className={`py-2 text-[10px] font-black rounded-xl border transition-all cursor-pointer ${
                          isSel 
                            ? 'bg-[#3D5F30] border-[#3D5F30] text-white' 
                            : 'bg-white border-zinc-200 text-brand-forest hover:bg-gray-50'
                        }`}
                      >
                        {diff.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuizModal(false)}
                className="flex-1 py-2.5 border border-zinc-200 text-zinc-500 rounded-xl text-[10px] font-black hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartQuiz}
                className="flex-1 py-2.5 bg-[#3D5F30] hover:bg-[#1A2C18] text-white rounded-xl text-[10px] font-black active:scale-[0.98] transition-all cursor-pointer text-center"
              >
                Generate Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

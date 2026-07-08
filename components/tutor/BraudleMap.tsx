'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { api } from '@/lib/api';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  BookOpen, 
  FileQuestion, 
  MessageSquare,
  Network,
  RotateCcw
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

interface SVGPath {
  id: string;
  type: 'root-chapter' | 'chapter-concept';
  from: { x: number; y: number };
  to: { x: number; y: number };
  active: boolean;
}

interface BraudleMapProps {
  documentId: string;
  onAskTutor: (conceptName: string) => void;
  onGenerateQuiz: (conceptName: string) => void;
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
  const [mobileStep, setMobileStep] = useState<'chapters' | 'concepts'>('chapters');

  // Layout refs
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const conceptRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [paths, setPaths] = useState<SVGPath[]>([]);

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

  // Recalculate node connectors coordinates (desktop only)
  const updateLayout = () => {
    if (!containerRef.current || !rootRef.current || !mapData || window.innerWidth < 768) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const getCoords = (el: HTMLElement, edge: 'left' | 'right') => {
      const rect = el.getBoundingClientRect();
      const x = rect.left - containerRect.left + (edge === 'right' ? rect.width : 0);
      const y = rect.top - containerRect.top + rect.height / 2;
      return { x, y };
    };

    const rootCoords = getCoords(rootRef.current, 'right');
    const newPaths: SVGPath[] = [];

    const chapters = mapData.chapters || [];
    chapters.forEach((ch) => {
      const chEl = chapterRefs.current[ch.id];
      if (!chEl) return;
      const chLeft = getCoords(chEl, 'left');
      const isSelected = ch.id === selectedChapterId;

      newPaths.push({
        id: `root-to-${ch.id}`,
        type: 'root-chapter',
        from: rootCoords,
        to: chLeft,
        active: isSelected
      });

      if (isSelected) {
        const chRight = getCoords(chEl, 'right');
        ch.concepts.forEach((concept) => {
          const conceptEl = conceptRefs.current[concept.id];
          if (!conceptEl) return;
          const conceptLeft = getCoords(conceptEl, 'left');

          newPaths.push({
            id: `${ch.id}-to-${concept.id}`,
            type: 'chapter-concept',
            from: chRight,
            to: conceptLeft,
            active: true
          });
        });
      }
    });

    setPaths(newPaths);
  };

  // Recalculate coordinates on adjustments
  useLayoutEffect(() => {
    if (mapData) {
      const timer = setTimeout(updateLayout, 100);
      window.addEventListener('resize', updateLayout);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateLayout);
      };
    }
  }, [mapData, selectedChapterId, selectedConcept]);

  const selectedChapter = mapData?.chapters.find(c => c.id === selectedChapterId);

  // Bezier curve paths generator
  const drawBezier = (path: SVGPath) => {
    const { from, to } = path;
    const dx = Math.abs(to.x - from.x);
    const cxOffset = Math.min(dx / 1.7, 100); 
    const cx1 = from.x + cxOffset;
    const cy1 = from.y;
    const cx2 = to.x - cxOffset;
    const cy2 = to.y;

    return `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 flex-1">
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
      <div className="flex flex-col items-center justify-center p-10 text-center space-y-4 flex-1">
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
      ref={containerRef}
      className="relative flex flex-col h-full w-full select-none text-left overflow-hidden min-h-0 bg-[#F6F7F2]"
      style={{
        backgroundImage: 'radial-gradient(#E2E6DD 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Dynamic Connection Lines Canvas (Hidden on Mobile) */}
      <svg className="hidden md:block absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="active-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4A783A" />
            <stop offset="100%" stopColor="#C2E1A6" />
          </linearGradient>
        </defs>

        {paths.map((path) => {
          if (path.active) {
            return (
              <g key={path.id}>
                <path
                  d={drawBezier(path)}
                  stroke="url(#active-gradient)"
                  strokeWidth="5"
                  fill="none"
                  className="opacity-15 blur-[2.5px]"
                />
                <path
                  d={drawBezier(path)}
                  stroke="url(#active-gradient)"
                  strokeWidth="2"
                  fill="none"
                  className="stroke-[2.5px]"
                  style={{
                    strokeDasharray: '6 4',
                    animation: 'map-flow 1.2s linear infinite'
                  }}
                />
              </g>
            );
          } else {
            return (
              <path
                key={path.id}
                d={drawBezier(path)}
                stroke="#E2E6DD"
                strokeWidth="1.5"
                fill="none"
                className="opacity-60"
              />
            );
          }
        })}
      </svg>

      <style>{`
        @keyframes map-flow {
          to {
            stroke-dashoffset: -20;
          }
        }
      `}</style>

      {/* MOBILE DRILL-DOWN STACK LAYOUT */}
      <div className="flex md:hidden flex-col h-full w-full p-4 overflow-y-auto z-10 min-h-0">
        {mobileStep === 'chapters' ? (
          <div className="space-y-4">
            {/* Subject Root Card */}
            <div className="p-4.5 rounded-2xl bg-[#3D5F30] border border-brand-yellow/15 text-white flex items-center gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Network className="w-4 h-4 text-brand-yellow" />
              </div>
              <div className="text-left overflow-hidden">
                <h3 className="font-extrabold text-[12px] leading-snug truncate">
                  {mapData?.title}
                </h3>
                <span className="text-[8px] font-black text-brand-yellow/80 uppercase tracking-wider block mt-0.5">
                  Knowledge Tree
                </span>
              </div>
            </div>

            {/* Chapters list */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-brand-forest/40 uppercase tracking-widest block mb-2">
                Chapters / Study Topics
              </span>
              {mapData?.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setSelectedChapterId(chapter.id);
                    setSelectedConcept(null);
                    setMobileStep('concepts');
                  }}
                  className="w-full p-4.5 rounded-2xl text-left border bg-white border-zinc-200/80 text-brand-forest flex items-center justify-between active:scale-[0.98] transition-all shadow-3xs"
                >
                  <h4 className="font-extrabold text-[11px] leading-snug pr-3 line-clamp-2">
                    {chapter.title}
                  </h4>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col h-full min-h-0">
            {/* Navigation back ribbon */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50">
              <button
                onClick={() => setMobileStep('chapters')}
                className="flex items-center gap-1 text-[9.5px] font-black text-brand-forest uppercase tracking-wider bg-[#E2E6DD]/50 border border-zinc-200/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                <span>← Chapters</span>
              </button>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate max-w-[200px]" title={selectedChapter?.title}>
                {selectedChapter?.title.split(':')[0]}
              </span>
            </div>

            {/* Concepts list */}
            {selectedChapter ? (
              <div className="space-y-2.5 overflow-y-auto flex-1 pb-32">
                <span className="text-[9px] font-black text-brand-forest/40 uppercase tracking-widest block">
                  Concepts inside this Chapter
                </span>
                {selectedChapter.concepts.map((concept) => {
                  const isConceptSelected = selectedConcept?.id === concept.id;
                  return (
                    <button
                      key={concept.id}
                      onClick={() => {
                        setSelectedConcept(concept);
                      }}
                      className={`w-full p-4 rounded-2xl text-left border transition-all duration-300 active:scale-[0.98] flex flex-col relative overflow-hidden shadow-3xs ${
                        isConceptSelected
                          ? 'bg-gradient-to-br from-white to-[#FCFDF9] border-brand-green text-brand-forest shadow-xs'
                          : 'bg-white border-zinc-200/80 text-brand-forest hover:bg-white'
                      }`}
                    >
                      {isConceptSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-green" />
                      )}
                      <h4 className="font-extrabold text-[11px] leading-snug">
                        {concept.name}
                      </h4>
                      <p className="text-[9.5px] text-gray-400 font-semibold leading-normal mt-1.5 line-clamp-3">
                        {concept.explanation}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-medium">Chapter not found.</p>
            )}
          </div>
        )}
      </div>

      {/* DESKTOP-ONLY COLUMNS ROW LAYOUT */}
      <div className="hidden md:flex justify-between items-start gap-8 px-6 py-6 h-full min-h-0 z-10">
        
        {/* Column 1: Root Node (Subject) */}
        <div className="flex-shrink-0 pt-16">
          <div 
            ref={rootRef}
            className="w-40 p-4 rounded-2xl bg-[#3D5F30] border border-brand-yellow/15 text-white shadow-md text-left space-y-1.5"
          >
            <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
              <Network className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
            <h3 className="font-extrabold text-[12px] leading-snug truncate" title={mapData?.title}>
              {mapData?.title}
            </h3>
            <span className="text-[9px] font-black text-brand-yellow uppercase tracking-wider block">
              Workspace Source
            </span>
          </div>
        </div>

        {/* Column 2: Chapters List */}
        <div className="w-48 flex flex-col gap-2.5 max-h-full overflow-y-auto pr-1 shrink-0 pt-4">
          <span className="text-[9px] font-black text-brand-forest/40 uppercase tracking-widest block mb-1">
            Chapters / Topics
          </span>
          {mapData?.chapters.map((chapter) => {
            const isSelected = chapter.id === selectedChapterId;
            return (
              <button
                key={chapter.id}
                ref={(el) => {
                  chapterRefs.current[chapter.id] = el;
                }}
                onClick={() => {
                  setSelectedChapterId(chapter.id);
                  setSelectedConcept(null);
                }}
                className={`w-full p-3.5 rounded-2xl text-left border transition-all duration-300 relative group active:scale-[0.98] shadow-3xs ${
                  isSelected
                    ? 'bg-gradient-to-br from-white to-[#F0F2EB] border-[#A5D07F] text-brand-forest shadow-xs'
                    : 'bg-white/80 backdrop-blur-xs border-gray-200/60 text-brand-forest/80 hover:bg-white hover:border-gray-300'
                }`}
              >
                <h4 className="font-extrabold text-[11px] leading-snug line-clamp-2">
                  {chapter.title}
                </h4>
                {isSelected && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Column 3: Concepts List */}
        <div className="flex-1 flex flex-col gap-2.5 max-h-full overflow-y-auto pr-1 pt-4">
          {selectedChapter ? (
            <>
              <span className="text-[9px] font-black text-brand-forest/40 uppercase tracking-widest block mb-1">
                Concepts inside {selectedChapter.title.split(':')[0]}
              </span>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
                {selectedChapter.concepts.map((concept) => {
                  const isConceptSelected = selectedConcept?.id === concept.id;
                  return (
                    <button
                      key={concept.id}
                      ref={(el) => {
                        conceptRefs.current[concept.id] = el;
                      }}
                      onClick={() => {
                        setSelectedConcept(concept);
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all duration-300 active:scale-[0.98] shadow-3xs flex flex-col justify-between min-h-[95px] relative overflow-hidden ${
                        isConceptSelected
                          ? 'bg-gradient-to-br from-white to-[#FCFDF9] border-brand-green text-brand-forest shadow-xs'
                          : 'bg-white/80 backdrop-blur-xs border-gray-200/60 text-brand-forest hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      {isConceptSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-green" />
                      )}
                      
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-[11.5px] leading-snug line-clamp-1">
                          {concept.name}
                        </h4>
                        <p className="text-[9.5px] text-gray-400 font-medium leading-normal line-clamp-2">
                          {concept.explanation}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-gray-100 w-full justify-between">
                        <span className="text-[8.5px] font-black text-[#8BA476] bg-brand-green/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Ready
                        </span>
                        <ChevronRight className={`w-3.5 h-3.5 text-zinc-400 transition-all ${isConceptSelected ? 'text-brand-green translate-x-0.5' : ''}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex-1 border border-dashed border-gray-200/80 rounded-2xl flex items-center justify-center p-8 text-center text-gray-400">
              <p className="text-[10px] max-w-[200px]">Select a chapter to explore its internal learning path.</p>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Actions Drawer Overlay */}
      {selectedConcept && (
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-6 p-4 md:p-5 bg-white/95 backdrop-blur-md border border-zinc-200 rounded-3xl shadow-lg z-20 animate-in slide-in-from-bottom-4 duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1 text-left max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
              <h4 className="font-extrabold text-[12px] md:text-[12.5px] text-brand-forest">
                {selectedConcept.name}
              </h4>
            </div>
            <p className="text-[9.5px] md:text-[10.5px] text-gray-400 font-semibold leading-relaxed">
              {selectedConcept.explanation}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={() => onAskTutor(selectedConcept.name)}
              className="flex-1 md:flex-initial px-3 py-2.5 bg-[#4A783A] text-white hover:bg-[#3D5F30] rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-yellow" />
              <span>Ask Tutor</span>
            </button>
            <button
              onClick={() => onStudyFlashcards(selectedConcept.name)}
              className="flex-1 md:flex-initial px-3 py-2.5 bg-rose-50 hover:bg-rose-100/60 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => onGenerateQuiz(selectedConcept.name)}
              className="flex-1 md:flex-initial px-3 py-2.5 bg-blue-50 hover:bg-blue-100/60 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-3xs"
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { BookOpen, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { renderInlineContent } from '@/components/tutor/MarkdownRenderer';

interface FlashcardItem {
  topic: string;
  front: string;
  back: string;
}

interface FlashcardsPanelProps {
  flashcards: FlashcardItem[];
  flashcardCount: number;
  setFlashcardCount: (count: number) => void;
  flashcardFocus: string;
  setFlashcardFocus: (focus: string) => void;
  flashcardLimitError: string | null;
  isStreaming: boolean;
  isGeneratingFlashcards: boolean;
  handleCreateCustomFlashcards: (count: number, focus: string) => void;
  currentFlashcardIdx: number;
  setCurrentFlashcardIdx: React.Dispatch<React.SetStateAction<number>>;
  isFlipped: boolean;
  setIsFlipped: React.Dispatch<React.SetStateAction<boolean>>;
  onRateCard?: (conceptName: string, quality: number) => Promise<void>;
  onCreateNewDeck?: () => void;
  parsedFlashcardDecks?: any[];
  selectedFlashcardDeckId?: string | null;
  onSelectDeck?: (id: string | null) => void;
  docTitle?: string;
}

export default function FlashcardsPanel({
  flashcards,
  flashcardCount,
  setFlashcardCount,
  flashcardFocus,
  setFlashcardFocus,
  flashcardLimitError,
  isStreaming,
  isGeneratingFlashcards,
  handleCreateCustomFlashcards,
  currentFlashcardIdx,
  setCurrentFlashcardIdx,
  isFlipped,
  setIsFlipped,
  onRateCard,
  onCreateNewDeck,
  parsedFlashcardDecks = [],
  selectedFlashcardDeckId = null,
  onSelectDeck,
  docTitle = 'Document',
}: FlashcardsPanelProps) {

  const setPricingModalOpen = useStore((state) => state.setPricingModalOpen);
  const [showConfigForm, setShowConfigForm] = React.useState(false);

  React.useEffect(() => {
    if (selectedFlashcardDeckId === 'new') {
      setShowConfigForm(true);
    } else {
      setShowConfigForm(false);
    }
  }, [selectedFlashcardDeckId]);

  const renderFlashcardsListOrCard = () => {
    if (parsedFlashcardDecks.length === 0) {
      // First time view: Generate card
      return (
        <div className="flex-grow flex flex-col justify-center gap-6 py-4 animate-in fade-in duration-300">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-green/5 border border-brand-green/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider text-brand-green">Recall Guides</span>
            </div>
            <h3 className="font-extrabold text-2xl text-brand-forest tracking-tight leading-tight">
              Study Flashcards
            </h3>
            <p className="text-xs text-gray-400 font-medium leading-relaxed font-sans">
              Test your active recall and terminology definitions using spaced repetition decks.
            </p>
          </div>

          <div
            onClick={() => setShowConfigForm(true)}
            className="group relative bg-[#FCFDF9] border border-zinc-200/60 hover:border-brand-green/30 rounded-3xl p-6 text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between min-h-[180px] shadow-2xs"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow/15 text-brand-yellow flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-extrabold text-base text-brand-forest group-hover:text-brand-green transition-colors">
                  Generate flashcards
                </h4>
                <p className="text-xs text-gray-400 font-normal leading-relaxed mt-1.5 font-sans">
                  Create interactive flashcard decks from your study material to practice terminology, formulas, and vocab recall.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-brand-yellow/15 text-brand-forest">
                Recall Cards
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-brand-green group-hover:underline">
                Generate &rarr;
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Show list of generated decks
    return (
      <div className="flex-grow flex flex-col gap-5 overflow-y-auto py-2 pr-1 animate-in fade-in duration-300">
        <div className="flex items-center justify-between shrink-0">
          <div className="text-left">
            <h3 className="font-extrabold text-lg text-brand-forest tracking-tight leading-none">
              Generated Flashcards
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold mt-1.5">
              Study key terms and test your spaced repetition recall
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectDeck?.('new')}
            className="px-3.5 py-1.5 rounded-xl bg-brand-green text-white text-[11px] font-black uppercase tracking-wider hover:bg-brand-forest active:scale-95 transition-all shadow-3xs cursor-pointer"
          >
            + New Deck
          </button>
        </div>

        <div className="space-y-4">
          {parsedFlashcardDecks.map((deck, idx) => {
            const dateStr = deck.date;
            const formatDate = (ds: string) => {
              if (!ds) return '';
              const date = new Date(ds);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            };

            return (
              <div
                key={deck.id}
                onClick={() => onSelectDeck?.(deck.id)}
                className="group relative bg-white border border-zinc-200/60 hover:border-brand-green/30 rounded-3xl p-5 text-left cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] shadow-2xs flex flex-col gap-4 overflow-hidden"
              >
                {/* Heading & dots menu */}
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-extrabold text-[14px] text-brand-forest group-hover:text-brand-green transition-colors leading-tight line-clamp-2">
                    {docTitle || 'Study Deck'}
                  </h4>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-brand-forest hover:bg-zinc-55 transition-colors shrink-0"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-500">
                  <span className="px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-150 flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 text-zinc-400" />
                    {deck.cards.length} Cards
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-50 border border-zinc-150 flex items-center gap-1">
                    <svg className="w-2.5 h-2.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(dateStr)}
                  </span>
                </div>

                {/* PDF attachment link */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-150 rounded-xl select-none max-w-full shrink-0">
                  <div className="w-5 h-5 bg-rose-105 text-rose-600 rounded-md flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 truncate flex-1 leading-none">
                    {docTitle}.pdf
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleRate = async (quality: number) => {
    const card = flashcards[currentFlashcardIdx];
    if (!card) return;

    if (onRateCard) {
      await onRateCard(card.front, quality);
    }

    if (currentFlashcardIdx < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentFlashcardIdx(prev => prev + 1);
    } else {
      setIsFlipped(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-left flex-1 overflow-y-auto pr-1 min-h-0">
      {flashcards.length === 0 ? (
        !showConfigForm ? (
          renderFlashcardsListOrCard()
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-2">
              <h4 className="font-extrabold text-base text-brand-forest">
                Setup Flashcards Deck
              </h4>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                Configure how many cards to generate and specify any custom focus topics.
              </p>
            </div>

            <div className="space-y-4">
              {/* Flashcard Count */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                    Flashcard Count
                  </label>
                  <span className="text-[10px] font-extrabold text-brand-green bg-brand-green/10 px-2.5 py-0.5 rounded-full">
                    {flashcardCount} cards
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFlashcardCount(c)}
                      className={`py-2 px-3 border rounded-xl font-bold text-xs text-center transition-all ${
                        flashcardCount === c
                          ? 'border-brand-green bg-brand-green/5 text-brand-green'
                          : 'border-gray-150 bg-white text-brand-forest hover:bg-gray-50/40'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

            {/* Custom Focus Instructions */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                Custom Focus / Instructions (Optional)
              </label>
              <input
                type="text"
                value={flashcardFocus}
                onChange={(e) => setFlashcardFocus(e.target.value)}
                placeholder="e.g. Focus on vocabulary or key dates..."
                className="w-full p-3 border border-gray-150 rounded-xl bg-white text-xs font-medium text-brand-forest focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green transition-all"
              />
            </div>
          </div>

          {flashcardLimitError ? (
            <div className="p-4 bg-rose-50 border border-rose-150/40 rounded-2xl text-left space-y-3 animate-in fade-in duration-200 mt-4">
              <div className="flex gap-2 text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-xs font-bold leading-normal">
                  Limit reached for Flashcards generation!
                </div>
              </div>
              <p className="text-[10px] text-rose-600/90 leading-relaxed">
                Free tier users can only generate one flashcard deck every day. 
                You can generate another deck in <span className="font-extrabold">{flashcardLimitError}</span>, or upgrade plan for instant access!
              </p>
              <button
                type="button"
                onClick={() => {
                  setPricingModalOpen(true);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center active:scale-[0.98] shadow-3xs"
              >
                Upgrade Plan
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleCreateCustomFlashcards(flashcardCount, flashcardFocus)}
              disabled={isStreaming || isGeneratingFlashcards}
              className="w-full py-3.5 bg-brand-green text-white rounded-2xl text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer active:scale-95 shadow-2xs mt-4 flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <BookOpen className="w-4 h-4" />
              <span>{isGeneratingFlashcards ? 'Configuring Deck...' : 'Generate Flashcards Deck'}</span>
            </button>
          )}
        </div>
      )) : (
        /* Interactive Flashcard deck */
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider animate-in fade-in duration-100">
            <span className="truncate max-w-[120px]">Topic: {flashcards[currentFlashcardIdx]?.topic}</span>
            <div className="flex items-center gap-2 shrink-0">
              {onCreateNewDeck && (
                <button
                  type="button"
                  onClick={onCreateNewDeck}
                  className="px-2 py-0.5 rounded-md border border-zinc-200 text-[9px] font-bold text-zinc-500 hover:text-brand-green hover:border-brand-green bg-white transition-all cursor-pointer"
                >
                  + New Deck
                </button>
              )}
              <span>{currentFlashcardIdx + 1} of {flashcards.length}</span>
            </div>
          </div>

          {/* Flip Card */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full min-h-[260px] cursor-pointer rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all duration-500 relative select-none shadow-sm border active:scale-[0.99] ${
              !isFlipped
                ? 'bg-brand-forest text-white border-brand-yellow/20 hover:border-brand-yellow/45 hover:shadow-md'
                : 'bg-[#FCFDF9] text-brand-forest border-zinc-200/60 hover:border-brand-green/30 hover:shadow-md'
            }`}
          >
            {!isFlipped ? (
              <div className="space-y-4 flex flex-col items-center animate-in fade-in duration-200">
                <span className="text-[10px] font-black text-brand-yellow uppercase tracking-widest bg-brand-yellow/10 border border-brand-yellow/20 px-3.5 py-1.5 rounded-full">
                  FRONT
                </span>
                <h4 className="font-extrabold text-base sm:text-lg lg:text-xl leading-snug max-w-md">
                  {renderInlineContent(flashcards[currentFlashcardIdx]?.front)}
                </h4>
                <span className="text-[10px] text-gray-300/80 italic font-medium pt-3 block animate-bounce duration-1000">
                  Click card to reveal answer
                </span>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center animate-in fade-in duration-200">
                <span className="text-[10px] font-black text-brand-green uppercase tracking-widest bg-brand-green/10 border border-brand-green/20 px-3.5 py-1.5 rounded-full">
                  BACK
                </span>
                <div className="text-sm sm:text-base text-brand-forest font-extrabold leading-relaxed max-w-lg">
                  {renderInlineContent(flashcards[currentFlashcardIdx]?.back)}
                </div>
                <span className="text-[10px] text-brand-green/60 italic font-medium pt-3 block">
                  Click card to see question
                </span>
              </div>
            )}
          </div>

          {/* Spaced Repetition Ratings (visible when answer is revealed) */}
          {isFlipped && (
            <div className="space-y-2 animate-in slide-in-from-bottom-2 duration-300 select-none">
              <span className="text-[9px] font-extrabold tracking-wider uppercase text-zinc-400 block text-center">
                Rate your recall difficulty
              </span>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleRate(1)}
                  className="py-2.5 px-2 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-700 font-extrabold text-[11px] text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-3xs"
                  title="Completely forgot term or question"
                >
                  🔴 Forgot
                </button>
                <button
                  onClick={() => handleRate(3)}
                  className="py-2.5 px-2 rounded-xl border border-amber-250 bg-amber-50/50 hover:bg-amber-50 text-amber-700 font-extrabold text-[11px] text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-3xs"
                  title="Recalled but with serious effort"
                >
                  🟡 Hard
                </button>
                <button
                  onClick={() => handleRate(4)}
                  className="py-2.5 px-2 rounded-xl border border-emerald-250 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-extrabold text-[11px] text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-3xs"
                  title="Recalled correctly with slight delay"
                >
                  🟢 Good
                </button>
                <button
                  onClick={() => handleRate(5)}
                  className="py-2.5 px-2 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700 font-extrabold text-[11px] text-center transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] shadow-3xs"
                  title="Instantly recalled without hesitation"
                >
                  🔵 Easy
                </button>
              </div>
            </div>
          )}

          {/* Deck Nav buttons */}
          <div className="flex gap-2 pt-1 border-t border-zinc-150/40">
            <button
              disabled={currentFlashcardIdx === 0}
              onClick={() => {
                setIsFlipped(false);
                setCurrentFlashcardIdx(prev => Math.max(0, prev - 1));
              }}
              className="flex-1 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-brand-forest hover:bg-zinc-55 hover:border-zinc-300 transition-all cursor-pointer disabled:opacity-40"
            >
              Prev
            </button>
            <button
              disabled={currentFlashcardIdx === flashcards.length - 1}
              onClick={() => {
                setIsFlipped(false);
                setCurrentFlashcardIdx(prev => Math.min(flashcards.length - 1, prev + 1));
              }}
              className="flex-1 py-3 rounded-xl bg-brand-green text-white text-xs font-bold hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

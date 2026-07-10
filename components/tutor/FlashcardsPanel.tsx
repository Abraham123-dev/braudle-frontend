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
  onCreateNewDeck
}: FlashcardsPanelProps) {

  const setPricingModalOpen = useStore((state) => state.setPricingModalOpen);

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
      ) : (
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

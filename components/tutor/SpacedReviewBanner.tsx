'use client';

import React, { useState } from 'react';
import { RotateCcw, X, ArrowRight } from 'lucide-react';

interface SpacedReviewBannerProps {
  dueCount: number;
  onStartReview?: () => void;
  onDismiss?: () => void;
}

export default function SpacedReviewBanner({
  dueCount,
  onStartReview,
  onDismiss
}: SpacedReviewBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible || dueCount <= 0) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 transition-all dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left side: Icon & Text */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Spaced Repetition
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {dueCount} {dueCount === 1 ? 'concept' : 'concepts'} due
              </span>
            </div>
            <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
              Reviewing these today strengthens memory retention before decay sets in.
            </p>
          </div>
        </div>

        {/* Right side: Action & Dismiss Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {onStartReview && (
            <button
              onClick={onStartReview}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#006B3F] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#005230] active:bg-[#003d24] focus:outline-none focus:ring-2 focus:ring-[#006B3F]/40"
            >
              <span>Review Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Dismiss spaced review alert"
            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-900 dark:text-amber-400 dark:hover:bg-amber-900/40 dark:hover:text-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

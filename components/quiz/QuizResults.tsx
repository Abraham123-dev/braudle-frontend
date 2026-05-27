'use client';

import React from 'react';
import { Question } from './QuizQuestion';
import { Award, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface QuizResultsProps {
  questions: Question[];
  score: number; // 0 - 100
  onComplete: () => void;
}

export default function QuizResults({ questions, score, onComplete }: QuizResultsProps) {
  const passingScore = 80;
  const isPassed = score >= passingScore;

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4">
      {/* Score Header */}
      <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm text-center mb-8 dark:bg-zinc-900 dark:border-zinc-800">
        <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Award className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2 dark:text-zinc-100">
          Quiz Completed!
        </h2>
        <p className="text-zinc-500 mb-6 max-w-sm mx-auto dark:text-zinc-400">
          Here is your adaptive score based on your answers to this session's quiz.
        </p>

        {/* Score Ring */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400">
            {score}%
          </div>
        </div>

        <div className="flex justify-center">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
              isPassed
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
            }`}
          >
            {isPassed ? 'Exemplary Performance' : 'Needs Review'}
          </span>
        </div>
      </div>

      {/* Review Questions */}
      <h3 className="text-lg font-bold text-zinc-900 mb-4 dark:text-zinc-100">
        Review Questions ({questions.length})
      </h3>

      <div className="grid gap-6 mb-8">
        {questions.map((q, idx) => {
          const isCorrect = q.isCorrect;

          return (
            <div
              key={q.id || idx}
              className={`bg-white border rounded-2xl p-6 dark:bg-zinc-900 ${
                isCorrect
                  ? 'border-emerald-100 dark:border-emerald-950/50'
                  : 'border-rose-100 dark:border-rose-950/50'
              }`}
            >
              <div className="flex gap-2 items-start justify-between mb-3">
                <div className="flex gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-zinc-100 text-zinc-600 font-bold text-xs dark:bg-zinc-800 dark:text-zinc-400">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider self-center">
                    {q.type.replace('_', ' ')}
                  </span>
                </div>
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-zinc-900 mb-3 dark:text-zinc-100">
                {q.question}
              </h4>

              <div className="grid gap-2 text-xs mb-4">
                <div className="flex gap-2 bg-zinc-50 p-2.5 rounded-lg dark:bg-zinc-950">
                  <span className="font-semibold text-zinc-500 w-24">Your Answer:</span>
                  <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                    {q.studentAnswer || '(No Answer)'}
                  </span>
                </div>
                {!isCorrect && (
                  <div className="flex gap-2 bg-emerald-50/50 p-2.5 rounded-lg dark:bg-emerald-950/20">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400 w-24">Correct:</span>
                    <span className="text-emerald-900 dark:text-emerald-300">
                      {q.answer}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <h5 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                  Explanation
                </h5>
                <p className="text-xs text-zinc-600 leading-relaxed dark:text-zinc-400">
                  {q.explanation}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Button */}
      <button
        type="button"
        onClick={onComplete}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 py-4 text-sm font-semibold text-white hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg dark:bg-indigo-700 dark:hover:bg-indigo-800"
      >
        Return to Dashboard <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

'use client';

import React from 'react';

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'theory' | 'true_false';
  options?: string[];
  answer: string;
  explanation: string;
  studentAnswer?: string;
  isCorrect?: boolean;
}

interface QuizQuestionProps {
  question: Question;
  index: number;
  selectedAnswer?: string;
  onSelectAnswer: (answer: string) => void;
  disabled?: boolean;
}

export default function QuizQuestion({
  question,
  index,
  selectedAnswer = '',
  onSelectAnswer,
  disabled = false,
}: QuizQuestionProps) {
  const isMcq = question.type === 'mcq' || question.type === 'true_false';

  return (
    <div className="w-full bg-white border border-zinc-100 rounded-2xl p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex gap-3 mb-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-semibold text-sm dark:bg-indigo-950/50 dark:text-indigo-400">
          {index + 1}
        </span>
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider self-center">
          {question.type.replace('_', ' ')}
        </span>
      </div>

      <h3 className="text-base font-semibold text-zinc-900 mb-4 leading-relaxed dark:text-zinc-100">
        {question.question}
      </h3>

      {isMcq ? (
        <div className="grid gap-3">
          {question.options?.map((option, idx) => {
            const letter = String.fromCharCode(65 + idx); // A, B, C, D
            const isSelected = selectedAnswer === option || selectedAnswer === letter;

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => onSelectAnswer(option)}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-300'
                    : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50 dark:text-zinc-300'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border text-xs font-semibold ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-500 dark:bg-indigo-500'
                      : 'border-zinc-300 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}
                >
                  {letter}
                </span>
                <span className="flex-1">{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full">
          <textarea
            disabled={disabled}
            value={selectedAnswer}
            onChange={(e) => onSelectAnswer(e.target.value)}
            placeholder="Type your detailed explanation here..."
            rows={4}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-600 dark:focus:bg-zinc-950"
          />
        </div>
      )}
    </div>
  );
}

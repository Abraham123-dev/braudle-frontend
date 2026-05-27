'use client';

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(Math.round((current / total) * 100), 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        <span>{label || 'Session Progress'}</span>
        <span>{current} / {total} chunks ({percentage}%)</span>
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden dark:bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out dark:from-indigo-600 dark:to-indigo-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';

interface SlideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function SlideDrawer({ isOpen, onClose, title, subtitle, children }: SlideDrawerProps) {

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-brand-forest/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 flex flex-col bg-white shadow-2xl border-l border-zinc-200/70
          w-full sm:w-[440px] lg:w-[460px]
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-zinc-100 bg-white">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-brand-forest hover:bg-zinc-100 transition-all cursor-pointer shrink-0"
            aria-label="Close panel"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-extrabold text-brand-forest font-sans truncate leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-brand-forest hover:bg-zinc-100 transition-all cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>
      </div>
    </>
  );
}

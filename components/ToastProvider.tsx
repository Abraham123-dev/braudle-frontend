'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { toastBus, ToastEvent, ToastType } from '@/lib/toast';

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle  className="w-5 h-5 flex-shrink-0" />,
  error:   <AlertCircle  className="w-5 h-5 flex-shrink-0" />,
  info:    <Info         className="w-5 h-5 flex-shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 flex-shrink-0" />,
};

const COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-900/90 border-emerald-700/60 text-emerald-100 [&_svg]:text-emerald-400',
  error:   'bg-red-950/90    border-red-800/60      text-red-100   [&_svg]:text-red-400',
  info:    'bg-zinc-900/90   border-zinc-700/60     text-zinc-100  [&_svg]:text-sky-400',
  warning: 'bg-amber-950/90  border-amber-800/60    text-amber-100 [&_svg]:text-amber-400',
};

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const unsub = toastBus.subscribe((event) => {
      setToasts((prev) => [...prev, event]);
      const duration = event.duration ?? 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }, duration);
    });
    return unsub;
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={`
              w-full flex items-start gap-3 px-4 py-3 rounded-2xl
              border backdrop-blur-xl shadow-xl
              pointer-events-auto
              ${COLORS[t.type]}
            `}
          >
            {ICONS[t.type]}
            <p className="flex-1 text-[13.5px] leading-snug font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="p-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

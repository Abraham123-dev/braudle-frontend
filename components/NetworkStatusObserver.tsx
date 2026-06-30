'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { testConnection } from '@/lib/api';
import { WifiOff, RefreshCw, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NetworkStatusObserver() {
  const { isOffline, connectionError, setIsOffline, setConnectionError } = useStore();
  const [retrying, setRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // 1. Listen to window online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      const offline = !navigator.onLine;
      setIsOffline(offline);
      if (!offline) {
        // If we transitioned back to online, test server connection
        handleRetry();
      }
    };

    updateStatus();

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, [setIsOffline]);

  // Reset dismissal when offline state changes to true
  useEffect(() => {
    if (isOffline || connectionError) {
      setDismissed(false);
    }
  }, [isOffline, connectionError]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const connected = await testConnection();
      if (connected) {
        setConnectionError(false);
        setIsOffline(false);
      }
    } catch (err) {
      console.error('Failed to retry connection:', err);
    } finally {
      setRetrying(false);
    }
  };

  const showUI = (isOffline || connectionError) && !dismissed;

  return (
    <AnimatePresence>
      {showUI && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-40px)] bg-zinc-900/95 dark:bg-black/90 backdrop-blur-xl text-white rounded-3xl border border-zinc-800 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 select-none overflow-hidden"
        >
          {/* Ambient Glow Background Effect */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex gap-4 items-start relative z-10">
            {/* Pulsing Status Icon */}
            <div className="p-3 bg-zinc-800/80 rounded-2xl border border-zinc-700/50 flex-shrink-0 flex items-center justify-center relative">
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full" />
              {isOffline ? (
                <WifiOff className="w-6 h-6 text-zinc-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400" />
              )}
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-[15px] font-semibold text-zinc-100 tracking-tight">
                  {isOffline ? 'You are offline' : 'Server Connection Lost'}
                </h4>
                <button
                  onClick={() => setDismissed(true)}
                  className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                {isOffline
                  ? 'It looks like your internet connection is off. Check your network or data settings.'
                  : "We can't reach our servers right now. Let's check your connection."}
              </p>

              {/* Action buttons */}
              <div className="flex gap-2.5 mt-4">
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="flex-1 py-2 px-4 bg-zinc-100 text-zinc-900 rounded-xl text-xs font-semibold hover:bg-white active:bg-zinc-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                  {retrying ? 'Verifying...' : 'Check Connection'}
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="py-2 px-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

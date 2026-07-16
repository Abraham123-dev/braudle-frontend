/**
 * toast.ts
 *
 * Lightweight event-based toast system with no external dependencies.
 * Usage: import { toast } from '@/lib/toast';
 *        toast.error('Something went wrong');
 *        toast.success('Saved successfully!');
 *        toast.info('Tip: you can do X');
 */

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

// Simple in-memory event emitter — no React dependency required
type Listener = (event: ToastEvent) => void;
const listeners: Set<Listener> = new Set();

function emit(event: ToastEvent) {
  listeners.forEach((l) => l(event));
}

export const toastBus = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

let _counter = 0;

function createToast(type: ToastType, message: string, duration = 4000): void {
  const id = `toast_${Date.now()}_${_counter++}`;
  emit({ id, type, message, duration });
}

export const toast = {
  success: (message: string, duration?: number) => createToast('success', message, duration),
  error:   (message: string, duration?: number) => createToast('error',   message, duration),
  info:    (message: string, duration?: number) => createToast('info',    message, duration),
  warning: (message: string, duration?: number) => createToast('warning', message, duration),
};

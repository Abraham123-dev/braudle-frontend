/**
 * lib/hooks/useDocuments.ts
 *
 * Shared stale-while-revalidate document list hook.
 * Used by both /home and /library — single source of truth, single cache.
 *
 * Behaviour:
 *  - If cache is fresh (< 60s old): render immediately from cache, revalidate silently in background
 *  - If cache is stale or empty: show loading skeleton, fetch fresh, store in cache
 *  - On upload or delete: caller calls invalidateDocuments() to bust the cache immediately
 *  - If any documents are in processing/pending state: continues polling every 8s automatically
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useStore, DOCUMENTS_CACHE_TTL_MS } from '@/lib/store';
import type { Document } from '@/components/dashboard/DocumentCard';

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  refresh: (showLoading?: boolean) => Promise<void>;
}

export function useDocuments(): UseDocumentsReturn {
  const cachedDocs          = useStore((s) => s.documents);
  const documentsLastFetched = useStore((s) => s.documentsLastFetched);
  const setDocuments         = useStore((s) => s.setDocuments);

  const isCacheHit = documentsLastFetched !== null
    && (Date.now() - documentsLastFetched) < DOCUMENTS_CACHE_TTL_MS;

  // Show the loading skeleton only on a true cold start (no cache at all)
  const [loading, setLoading] = useState(!isCacheHit);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await api.get<any>('/documents');
      const docList: Document[] = Array.isArray(res) ? res : (res.documents ?? []);
      setDocuments(docList);
    } catch (err) {
      console.error('[useDocuments] Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  }, [setDocuments]);

  // ── Polling: keep running while any document is pending/processing ────────
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(() => {
      // Read current docs from store directly to avoid stale closure
      const { documents: current } = useStore.getState();
      const hasProcessing = current.some(
        (d) => d.processingStatus === 'processing' || d.processingStatus === 'pending'
      );
      if (hasProcessing) {
        refresh(false);
      } else {
        clearInterval(pollingRef.current!);
        pollingRef.current = null;
      }
    }, 8000);
  }, [refresh]);

  useEffect(() => {
    if (isCacheHit) {
      // Cache is fresh: render immediately from Zustand, then silently revalidate
      // in the background so data stays up to date without blocking render.
      refresh(false);
    } else {
      // Cache is cold: fetch with loading state
      refresh(true);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Start polling if any docs are processing after initial load
  useEffect(() => {
    const hasProcessing = cachedDocs.some(
      (d) => d.processingStatus === 'processing' || d.processingStatus === 'pending'
    );
    if (hasProcessing) startPolling();
  }, [cachedDocs, startPolling]);

  return {
    documents: cachedDocs,
    loading,
    refresh,
  };
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api, fetchWithRefresh } from '@/lib/api';
import { X, Upload, FileText, AlertCircle, Compass } from 'lucide-react';
import { useStore } from '@/lib/store';
import Logo from '@/components/Logo';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (sessionId: string) => void;
}

const INGESTION_STAGE_LABELS: Record<string, string> = {
  file_received:        'Got your document! Starting the analysis...',
  extracting_content:   'Reading through your document...',
  identifying_concepts: 'Picking out the key ideas and concepts...',
  building_learning_map:'Building your personal study map...',
  preparing_tutor:      'Almost ready! Your AI tutor is warming up...',
  ready:                'Done! Opening your workspace...',
  failed:               "Something went wrong. Let's try that again.",
};

const INGESTION_PROGRESS_MAP: Record<string, number> = {
  file_received: 56,
  extracting_content: 65,
  identifying_concepts: 78,
  building_learning_map: 88,
  preparing_tutor: 95,
};

// Within each stage, these targets define how far the bar ticks forward
// during heartbeat pulses so it never appears frozen during long AI waits.
const INGESTION_STAGE_CEILINGS: Record<string, number> = {
  file_received: 64,
  extracting_content: 77,
  identifying_concepts: 87,
  building_learning_map: 94,
  preparing_tutor: 98,
};

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const user = useStore((state) => state.user);
  const userPlan = user?.plan || 'free';

  const getUploadLimit = () => {
    if (userPlan === 'pro') return 50 * 1024 * 1024; // 50MB
    if (userPlan === 'plus') return 25 * 1024 * 1024; // 25MB
    return 11 * 1024 * 1024; // 11MB for Free (approx 10MB)
  };

  const getLimitLabel = () => {
    if (userPlan === 'pro') return '50MB';
    if (userPlan === 'plus') return '25MB';
    return '10MB';
  };

  const limitLabel = getLimitLabel();

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Real-time backend ingestion analysis phase states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  // Unified linear progress UX
  const [unifiedProgress, setUnifiedProgress] = useState(0);
  const [unifiedStageLabel, setUnifiedStageLabel] = useState('');

  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal closes or opens
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isPdf = selectedFile.type === 'application/pdf';
      const isImage = selectedFile.type.startsWith('image/');
      if (!isPdf && !isImage) {
        setError('Only PDF documents and image files (PNG, JPG, WEBP) are supported.');
        return;
      }
      const maxLimit = getUploadLimit();
      if (isPdf && selectedFile.size > maxLimit) {
        setError(`PDF files must be under ${limitLabel} for your ${userPlan.toUpperCase()} plan.`);
        return;
      }
      setFile(selectedFile);
      if (!title) {
        // Strip extension from default title
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const isPdf = selectedFile.type === 'application/pdf';
      const isImage = selectedFile.type.startsWith('image/');
      if (!isPdf && !isImage) {
        setError('Only PDF documents and image files (PNG, JPG, WEBP) are supported.');
        return;
      }
      const maxLimit = getUploadLimit();
      if (isPdf && selectedFile.size > maxLimit) {
        setError(`PDF files must be under ${limitLabel} for your ${userPlan.toUpperCase()} plan.`);
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const triggerFileSelect = () => {
    if (uploading || analyzing) return;
    fileInputRef.current?.click();
  };

  const pollIngestionStatus = (docId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      let settled = false;
      let currentStage = '';

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearInterval(restPollTimer);
        eventSource.close();
        fn();
      };

      // ── SSE stream: real-time push from Redis Pub/Sub ───────────────────────
      const eventSource = new EventSource(`${apiBaseUrl}/documents/${docId}/progress`, {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          settle(() => { setUnifiedProgress(100); setUnifiedStageLabel("You're all set! Opening your workspace..."); resolve(); });
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          if (parsed.error) { settle(() => reject(new Error(parsed.error))); return; }

          const status = parsed.status;
          const stage = parsed.stage;

          if (status === 'ready') {
            settle(() => { setUnifiedProgress(100); setUnifiedStageLabel("You're all set! Opening your workspace..."); resolve(); });
          } else if (status === 'failed') {
            settle(() => reject(new Error('Document analysis failed. Please verify the content and try again.')));
          } else if (stage) {
            // Stage update: jump to stage floor
            if (stage !== currentStage) {
              currentStage = stage;
              setUnifiedStageLabel(INGESTION_STAGE_LABELS[stage] || 'Working on your document...');
              setUnifiedProgress(prev => Math.max(prev, INGESTION_PROGRESS_MAP[stage] ?? 55));
            } else if (parsed.heartbeat) {
              // Heartbeat within same stage: tick the bar forward by 1% toward the ceiling
              // so the user sees movement during long AI waits instead of a frozen bar.
              const ceiling = INGESTION_STAGE_CEILINGS[stage] ?? 94;
              setUnifiedProgress(prev => prev < ceiling ? prev + 1 : prev);
            }
          }
        } catch {
          // Ignore malformed heartbeats
        }
      };

      eventSource.onerror = () => {
        // SSE dropped — REST poll will catch it up
        eventSource.close();
      };

      // ── REST safety net: poll every 4s in case SSE events are missed ────────
      // This fixes the "stuck at 55%" race condition where the worker publishes
      // progress events before the frontend's SSE subscription is established.
      // If the worker raced ahead, the REST poll immediately catches the real stage.
      const restPollTimer = setInterval(async () => {
        if (settled) return;
        try {
          const res = await api.get<any>(`/documents/${docId}/status`);
          const dbStage = res.processingStage;
          const dbStatus = res.processingStatus;

          if (dbStatus === 'ready') {
            settle(() => { setUnifiedProgress(100); setUnifiedStageLabel("You're all set! Opening your workspace..."); resolve(); });
          } else if (dbStatus === 'failed') {
            settle(() => reject(new Error('Document analysis failed. Please verify the content and try again.')));
          } else if (dbStage && dbStage !== currentStage) {
            // Worker has advanced to a new stage that SSE missed — sync the bar
            currentStage = dbStage;
            setUnifiedStageLabel(INGESTION_STAGE_LABELS[dbStage] || 'Working on your document...');
            setUnifiedProgress(prev => Math.max(prev, INGESTION_PROGRESS_MAP[dbStage] ?? 55));
          }
        } catch {
          // REST poll failure is non-fatal — SSE will still deliver if connected
        }
      }, 4000);
    });
  };

  const MULTIPART_THRESHOLD = 5 * 1024 * 1024; // 5MB — R2 minimum part size
  const CHUNK_SIZE = 5 * 1024 * 1024;           // 5MB chunks
  const MAX_PARALLEL_PARTS = 3;                  // upload 3 parts at a time

  /**
   * Uploads one part of a multipart upload via XHR so we get real byte progress.
   * Returns the ETag from R2's response headers.
   */
  const uploadPart = (signedUrl: string, chunk: Blob, onProgress: (bytes: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const etag = xhr.getResponseHeader('ETag') || '';
          resolve(etag.replace(/"/g, ''));
        } else {
          reject(new Error(`Part upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during part upload'));
      xhr.send(chunk);
    });
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF or image file to study.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a notebook title.');
      return;
    }

    setUploading(true);
    setError('');
    setUnifiedProgress(3);
    setUnifiedStageLabel('Getting everything ready...');

    const useMultipart = file.size >= MULTIPART_THRESHOLD;

    // Track multipart state for cleanup on failure
    let mpDocumentId: string | null = null;
    let mpUploadId: string | null = null;
    let mpFileKey: string | null = null;

    let uploadTimer: any = null;

    try {
      if (useMultipart) {
        // ── MULTIPART UPLOAD PATH (files ≥ 5MB) ───────────────────────────────
        // Real byte-accurate progress. Resumable. Uses 3 parallel chunks at a time.
        setUnifiedProgress(5);
        setUnifiedStageLabel('Getting your file ready...');

        // 1. Initiate multipart session + compute hash in parallel
        const [buffer, initiateRes] = await Promise.all([
          file.arrayBuffer(),
          api.post<{ documentId: string; uploadId: string; fileKey: string }>(
            '/documents/multipart/initiate',
            { filename: file.name, contentType: file.type, title: title.trim(), subject: subject.trim() || 'General' }
          ),
        ]);

        const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
        const fileHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        mpDocumentId = initiateRes.documentId;
        mpUploadId   = initiateRes.uploadId;
        mpFileKey    = initiateRes.fileKey;

        // 2. Split file into 5MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const partNumbers = Array.from({ length: totalChunks }, (_, i) => i + 1);

        // 3. Get presigned URLs for all parts
        setUnifiedProgress(10);
        setUnifiedStageLabel(`Splitting your file into ${totalChunks} parts for faster upload...`);
        const { parts: signedParts } = await api.post<{ parts: { partNumber: number; uploadUrl: string }[] }>(
          '/documents/multipart/presign-parts',
          { uploadId: mpUploadId, fileKey: mpFileKey, partNumbers }
        );

        // 4. Upload all parts with real progress tracking
        setUnifiedStageLabel('Uploading your document...');
        const completedParts: { partNumber: number; etag: string }[] = [];
        let bytesUploaded = 0;

        // Process parts in batches of MAX_PARALLEL_PARTS
        for (let i = 0; i < signedParts.length; i += MAX_PARALLEL_PARTS) {
          const batch = signedParts.slice(i, i + MAX_PARALLEL_PARTS);

          await Promise.all(batch.map(async ({ partNumber, uploadUrl }) => {
            const start = (partNumber - 1) * CHUNK_SIZE;
            const chunk = file.slice(start, start + CHUNK_SIZE);

            let prevBytes = 0;
            const etag = await uploadPart(uploadUrl, chunk, (loaded) => {
              const delta = loaded - prevBytes;
              prevBytes = loaded;
              bytesUploaded += delta;
              const pct = Math.min(45, 10 + Math.round((bytesUploaded / file.size) * 35));
              setUnifiedProgress(pct);
            });

            completedParts.push({ partNumber, etag });
          }));
        }

        // Sort parts by partNumber (parallel uploads may finish out of order)
        completedParts.sort((a, b) => a.partNumber - b.partNumber);

        // 5. Complete the multipart upload
        setUnifiedProgress(48);
        setUnifiedStageLabel('Upload complete! Hang tight...');
        await api.post('/documents/multipart/complete', {
          documentId: mpDocumentId,
          uploadId: mpUploadId,
          fileKey: mpFileKey,
          parts: completedParts,
        });

        // 6. Stamp fileHash for deduplication
        await api.post('/documents/confirm-upload', {
          documentId: mpDocumentId,
          fileHash,
        });

      } else {
        // ── SINGLE PUT PATH (files < 5MB) ──────────────────────────────────────
        // Fast path: parallel hash + presigned URL, then one direct PUT to R2.
        setUnifiedProgress(8);
        setUnifiedStageLabel('Getting your file ready...');

        const [buffer, presignRes] = await Promise.all([
          file.arrayBuffer(),
          api.post<{ uploadUrl?: string; documentId: string; cached?: boolean }>(
            '/documents/presigned-url',
            { filename: file.name, contentType: file.type, title: title.trim(), subject: subject.trim() || 'General' }
          ),
        ]);

        const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
        const fileHash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0')).join('');

        if (!presignRes.documentId) throw new Error('Failed to get upload authorization from server.');

        const { uploadUrl, documentId, cached } = presignRes;
        mpDocumentId = documentId;

        if (cached) {
          // Instant cache hit — skip upload entirely
          setUnifiedProgress(85);
          setUnifiedStageLabel('Found your document! Loading it instantly...');
          const sessionRes = await api.post<any>('/sessions/start', { documentId, mode: 'understand' });
          if (sessionRes.sessionId) {
            setUnifiedProgress(100);
            setUnifiedStageLabel("You're all set! Opening your workspace...");
            setTimeout(() => { onUploadSuccess(sessionRes.sessionId); onClose(); resetForm(); }, 800);
            return;
          } else {
            throw new Error('No session ID returned from study initialization.');
          }
        }

        // Animate progress during single PUT
        setUnifiedStageLabel('Uploading your document...');
        uploadTimer = setInterval(() => {
          setUnifiedProgress(prev => {
            if (prev < 45) return prev + 2;
            if (uploadTimer) clearInterval(uploadTimer);
            return prev;
          });
        }, 150);

        if (!uploadUrl) throw new Error('No upload URL returned from server.');

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        clearInterval(uploadTimer);
        uploadTimer = null;

        if (!uploadResponse.ok) throw new Error('Direct-to-cloud file streaming failed.');

        await api.post('/documents/confirm-upload', { documentId, fileHash });
      }

      // ── POST-UPLOAD: common to both paths ──────────────────────────────────
      const documentId = mpDocumentId!;

      setUnifiedProgress(50);
      setUnifiedStageLabel('Creating your study space...');
      setUploading(false);
      setAnalyzing(true);

      const sessionRes = await api.post<any>('/sessions/start', { documentId, mode: 'understand' });
      if (sessionRes.sessionId) {
        setUnifiedProgress(52);
        setUnifiedStageLabel('Waking up your AI tutor...');
        await pollIngestionStatus(documentId);
        setUnifiedProgress(100);
        setUnifiedStageLabel("You're all set! Opening your workspace...");
        setTimeout(() => { onUploadSuccess(sessionRes.sessionId); onClose(); resetForm(); }, 800);
      } else {
        throw new Error('No session ID returned from study initialization.');
      }

    } catch (err: any) {
      if (uploadTimer) clearInterval(uploadTimer);

      // If multipart was initiated, abort it to clean up R2 and roll back counters
      if (mpUploadId && mpFileKey && mpDocumentId) {
        api.post('/documents/multipart/abort', {
          documentId: mpDocumentId,
          uploadId: mpUploadId,
          fileKey: mpFileKey,
        }).catch(() => {}); // fire-and-forget
      }

      console.error(err);
      setError(err.message || 'An error occurred during upload or analysis. Please try again.');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  function resetForm() {
    setFile(null);
    setTitle('');
    setSubject('');
    setError('');
    setUploadProgress(0);
    setAnalyzing(false);
    setAnalysisStage('');
    setAnalysisProgress(0);
    setUnifiedProgress(0);
    setUnifiedStageLabel('');
  }

  const busy = uploading || analyzing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {busy ? (
        /* Transparent floating loader layout instead of the card container */
        <div className="flex flex-col items-center justify-center max-w-sm w-full text-center space-y-6 select-none animate-in scale-in duration-200">
          {/* Logo Spinner */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-brand-green animate-spin" />
            <div className="absolute inset-2 rounded-full bg-brand-green/5 border border-brand-green/10 animate-pulse" />
            <Logo size={46} className="animate-pulse object-contain z-10" />
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-lg text-white leading-tight">
              Preparing Your Workspace
            </h3>
            <p className="text-[11.5px] text-brand-green font-bold uppercase tracking-wider animate-pulse">
              {unifiedStageLabel}
            </p>
          </div>

          {/* Sleek Translucent Progress Bar */}
          <div className="w-full space-y-2.5 backdrop-blur-md bg-white/5 border border-white/10 p-5 rounded-3xl">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-white/80">
              <span>Progress</span>
              <span className="text-brand-green">{unifiedProgress}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-green h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${unifiedProgress}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] text-white/40 font-normal leading-relaxed">
            Please stay on this screen while the AI maps your document structure.
          </p>
        </div>
      ) : (
        /* Regular White Card Dialog */
        <div 
          className="bg-white border border-gray-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in scale-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-50">
            <div>
              <h2 className="text-lg font-bold text-brand-forest">
                Add Study Source
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Form */}
          <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            
            {/* Drag & Drop File Area */}
            {!file ? (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-2xl p-3.5 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[85px] sm:min-h-[110px] ${
                  isDragOver 
                    ? 'border-brand-green bg-brand-green/5' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-55/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf, image/*"
                  className="hidden"
                />
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-1.5 sm:mb-2">
                  <Upload className="w-4 h-4 sm:w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs text-brand-forest mb-0.5">
                  <span className="hidden sm:inline">Drag and drop your PDF (max {limitLabel}) or image here</span>
                  <span className="sm:hidden">Tap to upload PDF (max {limitLabel}) or image</span>
                </h3>
                <p className="text-[10px] text-gray-400 hidden sm:block">
                  Or click to browse files from your computer (PDFs must be under {limitLabel})
                </p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-green/10 text-brand-green rounded-xl">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-brand-forest line-clamp-1 max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type === 'application/pdf' ? 'PDF Document' : 'Image File'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3.5 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                  Notebook Title
                </label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cellular Respiration Study Notes"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 sm:py-2.5 px-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60">
                  Subject
                </label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Biology, Economics, General (Optional)"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 sm:py-2.5 px-3.5 text-base sm:text-xs font-medium text-brand-forest focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex gap-2 items-start text-left animate-shake">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-green text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40 disabled:bg-brand-green active:scale-[0.98]"
              >
                Add to Workspace
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

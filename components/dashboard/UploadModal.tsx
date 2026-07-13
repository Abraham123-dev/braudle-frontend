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
  file_received: 'Collecting your study materials...',
  extracting_content: 'Reading document pages...',
  identifying_concepts: 'Analyzing key topics and formulas...',
  building_learning_map: 'Structuring your learning map...',
  preparing_tutor: 'Setting up your personal AI companion...',
  ready: 'Your study workspace is ready!',
  failed: "Ingestion paused. Let's try again.",
};

const INGESTION_PROGRESS_MAP: Record<string, number> = {
  file_received: 55,
  extracting_content: 70,
  identifying_concepts: 82,
  building_learning_map: 92,
  preparing_tutor: 97,
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
      const eventSource = new EventSource(`${apiBaseUrl}/documents/${docId}/progress`, {
        withCredentials: true,
      });

      eventSource.onmessage = (event) => {
        if (event.data === '[DONE]') {
          eventSource.close();
          setUnifiedProgress(100);
          setUnifiedStageLabel('AI tutor prepared successfully!');
          resolve();
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          if (parsed.error) {
            eventSource.close();
            reject(new Error(parsed.error));
            return;
          }

          const status = parsed.status;
          const stage = parsed.stage;

          if (status === 'ready') {
            eventSource.close();
            setUnifiedProgress(100);
            setUnifiedStageLabel('AI tutor prepared successfully!');
            resolve();
          } else if (status === 'failed') {
            eventSource.close();
            reject(new Error('Document analysis failed. Please verify the content and try again.'));
          } else {
            if (stage) {
              setUnifiedStageLabel(INGESTION_STAGE_LABELS[stage] || 'Analyzing document structure...');
              setUnifiedProgress(prev => Math.max(prev, INGESTION_PROGRESS_MAP[stage] || 50));
            }
          }
        } catch (e) {
          // Ignore parsing issues for heartbeats
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        
        // Single REST fallback check to see if document is already ready
        api.get<any>(`/documents/${docId}/status`)
          .then((res) => {
            if (res.processingStatus === 'ready') {
              setUnifiedProgress(100);
              setUnifiedStageLabel('AI tutor prepared successfully!');
              resolve();
            } else if (res.processingStatus === 'failed') {
              reject(new Error('Document analysis failed. Please verify the content and try again.'));
            } else {
              // Resubscribe after a short delay
              setTimeout(() => {
                pollIngestionStatus(docId).then(resolve).catch(reject);
              }, 2500);
            }
          })
          .catch(() => {
            reject(new Error('Real-time connection lost with the analysis server.'));
          });
      };
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
    setUnifiedStageLabel('Pre-indexing study materials...');

    let uploadTimer: any = null;

    try {
      // Compute SHA-256 file hash for instant deduplication check
      const buffer = await file.arrayBuffer();
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const fileHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      setUnifiedProgress(8);
      setUnifiedStageLabel('Checking workspace cache...');

      // 1. Request presigned upload URL from backend with pre-computed fileHash
      const presignRes = await api.post<{ uploadUrl?: string; documentId: string; cached?: boolean }>('/documents/presigned-url', {
        filename: file.name,
        contentType: file.type,
        title: title.trim(),
        subject: subject.trim() || 'General',
        fileHash,
      });

      if (!presignRes.documentId) {
        throw new Error('Failed to get upload authorization from server.');
      }

      const { uploadUrl, documentId, cached } = presignRes;

      if (cached) {
        // Instant load from cache! Skip R2 upload & processing stages.
        setUnifiedProgress(85);
        setUnifiedStageLabel('Workspace loaded instantly from cache!');
        
        // Start the session immediately
        const sessionRes = await api.post<any>('/sessions/start', {
          documentId,
          mode: 'understand',
        });

        if (sessionRes.sessionId) {
          setUnifiedProgress(100);
          setUnifiedStageLabel('Workspace ready! Loading dashboard...');

          setTimeout(() => {
            onUploadSuccess(sessionRes.sessionId);
            onClose();
            resetForm();
          }, 800);
          return;
        } else {
          throw new Error('No session ID returned from study initialization.');
        }
      }

      // Smoothly animate progress from 8% to 45% during active upload
      setUnifiedStageLabel('Uploading document source...');
      uploadTimer = setInterval(() => {
        setUnifiedProgress(prev => {
          if (prev < 45) return prev + 2;
          if (uploadTimer) clearInterval(uploadTimer);
          return prev;
        });
      }, 150);

      if (!uploadUrl) {
        throw new Error('No upload URL returned from server.');
      }

      // 2. Perform direct PUT upload to Cloudflare R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      clearInterval(uploadTimer);

      if (!uploadResponse.ok) {
        throw new Error('Direct-to-cloud file streaming failed.');
      }

      // 3. Confirm completed upload to start backend parser ingestion
      await api.post('/documents/confirm-upload', {
        documentId
      });

      setUnifiedProgress(48);
      setUnifiedStageLabel('Initializing study session...');
      setUploading(false);
      setAnalyzing(true);

      // 3. Create the session immediately
      const sessionRes = await api.post<any>('/sessions/start', {
        documentId,
        mode: 'understand', // Default starting mode
      });

      if (sessionRes.sessionId) {
        setUnifiedProgress(52);
        setUnifiedStageLabel('Connecting to AI backend...');
        
        await pollIngestionStatus(documentId);
        
        setUnifiedProgress(100);
        setUnifiedStageLabel('Workspace ready! Loading dashboard...');

        setTimeout(() => {
          onUploadSuccess(sessionRes.sessionId);
          onClose();
          resetForm();
        }, 800);
      } else {
        throw new Error('No session ID returned from study initialization.');
      }
    } catch (err: any) {
      if (uploadTimer) clearInterval(uploadTimer);
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

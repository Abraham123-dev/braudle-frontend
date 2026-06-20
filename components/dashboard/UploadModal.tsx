'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { X, Upload, FileText, AlertCircle, Compass } from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (sessionId: string) => void;
}

const STAGE_LABELS: Record<string, string> = {
  file_received: 'File received',
  extracting_content: 'Extracting content',
  identifying_concepts: 'Identifying key concepts',
  building_learning_map: 'Building learning map',
  preparing_tutor: 'Preparing AI tutor',
  ready: 'Ready to study!',
  failed: 'Processing failed',
};

const PROGRESS_MAP: Record<string, number> = {
  file_received: 16,
  extracting_content: 33,
  identifying_concepts: 50,
  building_learning_map: 66,
  preparing_tutor: 83,
};

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
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
      const interval = setInterval(async () => {
        try {
          const res = await api.get<any>(`/documents/${docId}/status`);
          const status = res.processingStatus;
          const stage = res.processingStage;
          
          if (status === 'ready') {
            clearInterval(interval);
            resolve();
          } else if (status === 'failed') {
            clearInterval(interval);
            reject(new Error('Document analysis failed. Please verify the content and try again.'));
          } else {
            // Update stages dynamically
            if (stage) {
              setAnalysisStage(STAGE_LABELS[stage] || 'Analyzing document structure...');
              setAnalysisProgress(PROGRESS_MAP[stage] || 10);
            }
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 3000);
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
    setUploadProgress(10);

    try {
      // 1. Get presigned PUT URL from our backend
      const presignedRes = await api.post<any>('/documents/presigned-url', {
        title: title.trim(),
        subject: subject.trim() || 'General',
        filename: file.name,
        contentType: file.type
      });

      const { documentId, uploadUrl } = presignedRes;

      if (!uploadUrl || !documentId) {
        throw new Error('Incomplete upload slot allocation from server.');
      }

      setUploadProgress(40);

      // 2. Perform direct binary PUT upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Direct file transfer to secure storage failed.');
      }

      setUploadProgress(80);

      // 3. Confirm upload with our backend to trigger ingestion pipeline
      await api.post('/documents/confirm-upload', { documentId });

      setUploadProgress(100);
      setUploading(false);

      // 4. Enter backend analysis phase (await document processing)
      setAnalyzing(true);
      setAnalysisStage('Analyzing document structure...');
      setAnalysisProgress(5);

      await pollIngestionStatus(documentId);

      // 5. Analysis is ready! Create a session automatically.
      setAnalysisStage('Preparing study space...');
      setAnalysisProgress(95);

      const sessionRes = await api.post<any>('/sessions/start', {
        documentId,
        mode: 'understand', // Default starting mode
      });

      if (sessionRes.sessionId) {
        setAnalysisProgress(100);
        onUploadSuccess(sessionRes.sessionId);
        onClose();
        resetForm();
      } else {
        throw new Error('No session ID returned from study initialization.');
      }
    } catch (err: any) {
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
  }

  const busy = uploading || analyzing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white border border-gray-100 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-in scale-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-50">
          <div>
            <h2 className="text-lg font-bold text-brand-forest">
              {analyzing ? 'Study Material' : 'Add Study Source'}
            </h2>
            {analyzing && (
              <p className="text-[10px] text-gray-400 mt-0.5">Please stay on this screen while the AI maps your document</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            disabled={busy}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          
          {/* Main Form Fields (Hidden during Ingestion Analysis) */}
          {!analyzing ? (
            <>
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
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
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
                    <span className="hidden sm:inline">Drag and drop your PDF or image here</span>
                    <span className="sm:hidden">Tap to upload PDF or image</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 hidden sm:block">
                    Or click to browse files from your computer
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
                    disabled={busy}
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
                    disabled={busy}
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
                    disabled={busy}
                  />
                </div>
              </div>
            </>
          ) : (
            /* Real-time Ingestion State Layout */
            <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center border border-brand-green/20 animate-spin duration-3000">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-brand-forest">
                  Mapping Key Concepts...
                </h3>
                <p className="text-[10px] text-gray-400 font-medium animate-pulse">
                  {analysisStage}
                </p>
              </div>

              {/* Analysis Progress Bar */}
              <div className="w-full space-y-1.5 text-left bg-gray-50 p-3 border border-gray-100 rounded-2xl">
                <div className="flex justify-between text-[10px] font-bold text-brand-forest/70">
                  <span>Tutoring Engine Ingestion</span>
                  <span>{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-200/60 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-brand-green h-full transition-all duration-300"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex gap-2 items-start text-left animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Progress Bar (Only during Uploading phase) */}
          {uploading && (
            <div className="space-y-1 text-left">
              <div className="flex justify-between text-[11px] font-semibold text-brand-forest/70">
                <span>Uploading to secure storage...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-green h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons (Hidden during Ingestion Analysis) */}
          {!analyzing && (
            <div className="flex items-center justify-end gap-2.5 pt-1.5">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy || !file}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-green text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer disabled:opacity-40 disabled:bg-brand-green active:scale-[0.98]"
              >
                {uploading ? 'Uploading...' : 'Add to Workspace'}
              </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}

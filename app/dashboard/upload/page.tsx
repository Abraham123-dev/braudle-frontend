'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, FileText, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError('');
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF documents are supported on the MVP tier.');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Document size exceeds the 50MB maximum allowed limit.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF documents are supported on the MVP tier.');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('Document size exceeds the 50MB maximum allowed limit.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    // Simulate API call to upload
    setTimeout(() => {
      setUploading(false);
      // Redirect back to dashboard to poll the processing state
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-zinc-100 z-10 dark:bg-zinc-950 dark:border-zinc-900">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-zinc-900 dark:text-zinc-50">Upload Study Material</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 sm:p-8 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
          <h2 className="text-xl font-bold text-zinc-900 mb-2 dark:text-zinc-50">Add New PDF</h2>
          <p className="text-xs text-zinc-400 mb-6 dark:text-zinc-400">
            Upload course notes, text papers, or textbooks. The AI engine will parse, semantically chunk, and map them to your learning style.
          </p>

          <form onSubmit={handleUploadSubmit} className="space-y-6">
            {/* Dropzone */}
            {!file ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-zinc-50/50 transition-all cursor-pointer dark:border-zinc-800 dark:hover:bg-zinc-950/20"
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="inline-flex p-4 bg-indigo-50 text-indigo-600 rounded-full mb-4 dark:bg-indigo-950/40 dark:text-indigo-400">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 mb-1 dark:text-zinc-50">
                    Drag and drop your PDF here
                  </h4>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    or click to browse local files (PDF only, max 50MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="flex items-center justify-between border border-zinc-200 rounded-2xl p-4 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg dark:bg-indigo-950/40 dark:text-indigo-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold text-zinc-900 max-w-xs sm:max-w-md truncate dark:text-zinc-50">
                      {file.name}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {error && (
              <div className="flex gap-2 items-center p-3.5 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl dark:bg-rose-950/20 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Subject Input */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Subject Tag (Optional)
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Biology, Mathematics, Chemistry"
                className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-indigo-600 dark:focus:bg-zinc-950"
              />
            </div>

            {/* Daily Usage warning */}
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 text-[11px] text-zinc-400 leading-relaxed">
              <strong>MVP Operational Notice:</strong> You are allowed 2 uploads per 24-hour cycle. Uploading starts the background indexing worker using BullMQ & Redis to split contents into lessons.
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-zinc-200 px-5 py-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file || uploading}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md dark:bg-indigo-700 dark:hover:bg-indigo-800"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Ingesting file...
                  </>
                ) : (
                  'Start Ingestion'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

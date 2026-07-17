'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { useDocuments } from '@/lib/hooks/useDocuments';
import Header from '@/components/dashboard/Header';
import DocumentCard, { Document } from '@/components/dashboard/DocumentCard';
import UploadModal from '@/components/dashboard/UploadModal';
import { Plus, Search } from 'lucide-react';

export default function LibraryPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);

  /* ── Document list (stale-while-revalidate via shared cache) ── */
  const { documents, loading: loadingDocs, refresh: refreshDocuments } = useDocuments();
  const invalidateDocuments = useStore((s) => s.invalidateDocuments);

  /* ── UI state ── */
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  const handleStartSession = async (docId: string, mode: 'teach' | 'quiz') => {
    try {
      setStartingSession(true);
      const res = await api.post<{ sessionId: string }>('/sessions/start', {
        documentId: docId,
        mode: mode === 'teach' ? 'understand' : 'practice',
      });
      if (res.sessionId) {
        router.push(`/session/${res.sessionId}`);
      }
    } catch (err: any) {
      toast.error('Failed to start session. Please try again.');
    } finally {
      setStartingSession(false);
    }
  };

  const handleUploadSuccess = (sessionId: string) => {
    invalidateDocuments();
    refreshDocuments(false);
    router.push(`/session/${sessionId}`);
  };

  /* ─── Computed ─── */

  const subjects = [
    'All',
    ...Array.from(
      new Set(
        documents
          .map((d) => d.subject)
          .filter((s): s is string => typeof s === 'string' && s.trim() !== '')
      )
    ),
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSubject = selectedSubject === 'All' || doc.subject === selectedSubject;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.subject && doc.subject.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-brand-forest font-sans flex flex-col">
        
        {/* ── Shared Header ── */}
        <Header 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          onUploadClick={() => setIsUploadOpen(true)} 
        />

        {/* Mobile search */}
        <div className="px-6 pt-4 md:hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-400">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-base sm:text-xs text-brand-forest focus:outline-none w-full placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* ══════════════ MAIN ══════════════ */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-12 flex flex-col">
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-left">
              <h1 className="text-3xl font-medium tracking-tight text-brand-forest">
                Your Library
              </h1>
              <p className="text-xs text-gray-400 font-medium mt-1">
                Manage your study documents and start teaching sessions
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="flex items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green/95 active:scale-[0.98] transition-all px-4.5 py-2 text-xs font-bold text-white cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Source</span>
              </button>
            </div>
          </div>

          {/* Subject Filters */}
          {subjects.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-brand-forest text-white'
                      : 'bg-gray-50 text-gray-400 hover:text-brand-forest hover:bg-gray-100 border border-gray-100/50'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Notebooks List */}
          {loadingDocs ? (
            <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5 animate-pulse">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="bg-gray-100/50 border border-gray-150 rounded-2xl p-5 aspect-[1.35/1] sm:aspect-[1.4/1] flex flex-col justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                  <div className="space-y-2 mt-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-150 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDocuments.length > 0 ? (
                <div className="flex flex-col gap-3.5 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
                  {/* Create notebook (Mobile) */}
                  <div
                    onClick={() => setIsUploadOpen(true)}
                    className="flex sm:hidden items-center gap-3.5 w-full p-4 rounded-[16px] border border-dashed border-gray-300 bg-white hover:bg-gray-50/50 cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                      <Plus className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-[13px] text-brand-forest">
                      Create notebook
                    </span>
                  </div>

                  {/* Create notebook (Desktop) */}
                  <div
                    onClick={() => setIsUploadOpen(true)}
                    className="hidden sm:flex border border-dashed border-gray-250 hover:border-brand-green/30 bg-white rounded-2xl flex-col items-center justify-center p-5 cursor-pointer hover:bg-gray-50/55 transition-all duration-200 aspect-[1.35/1] sm:aspect-[1.4/1]"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center mb-3">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xs text-brand-forest">
                      Create notebook
                    </span>
                  </div>

                  {filteredDocuments.map((doc) => (
                    <DocumentCard
                      key={doc.id || doc._id}
                      doc={doc}
                      onStartSession={handleStartSession}
                      onDeleteSuccess={() => { invalidateDocuments(); refreshDocuments(false); }}
                    />
                  ))}
                </div>
              ) : (
                !searchQuery ? (
                  <div className="border border-dashed border-gray-200 rounded-3xl p-12 text-center bg-gray-50/20 flex flex-col items-center justify-center space-y-4 max-w-md mx-auto my-6 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-brand-forest">Add your first source</h3>
                      <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                        Upload a PDF or image. Braudle will analyze and map your source material for interactive study.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsUploadOpen(true)}
                      className="px-5 py-2.5 rounded-full bg-brand-green hover:bg-brand-green/95 text-white font-bold text-xs shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                    >
                      Upload Document
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-100 rounded-3xl p-12 text-center bg-gray-50/50 text-left">
                    <p className="text-sm font-semibold text-brand-forest">No sources matched your search.</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 text-xs font-bold text-brand-green hover:underline cursor-pointer"
                    >
                      Clear search query
                    </button>
                  </div>
                )
              )}
            </div>
          )}

        </main>

        {/* ── Upload Modal ── */}
        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />

        {/* ── Session starting overlay ── */}
        {startingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/30 backdrop-blur-xs">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xl flex items-center gap-3 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-brand-green" />
              <span className="text-xs font-bold text-brand-forest">Preparing tutoring environment...</span>
            </div>
          </div>
        )}

      </div>
    </ProtectedRoute>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Bell, Search, Home, BookOpen, GraduationCap, Settings, Bot, ChevronRight, Clock, Plus, Loader2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import DocumentCard, { Document } from '@/components/dashboard/DocumentCard';
import SessionHistory, { HistoryItem } from '@/components/dashboard/SessionHistory';

const UPLOAD_STAGES = {
  file_received: { label: 'File received', step: 1 },
  extracting_content: { label: 'Extracting content', step: 2 },
  identifying_concepts: { label: 'Identifying key concepts', step: 3 },
  building_learning_map: { label: 'Building learning map', step: 4 },
  preparing_tutor: { label: 'Preparing AI tutor', step: 5 },
  ready: { label: 'Ready to study!', step: 6 },
  failed: { label: 'Processing failed', step: 0 },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<HistoryItem[]>([]);
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    status: 'idle' | 'uploading' | 'processing' | 'ready' | 'failed';
    documentId: string | null;
    stage: string;
    step: number;
    error: string | null;
  }>({ status: 'idle', documentId: null, stage: '', step: 0, error: null });

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function initDashboard() {
      try {
        const res = await api.get<{ user: any }>('/auth/me');
        if (res.user) {
          auth.setCurrentUser(res.user);
          setUser(res.user);

          if (res.user.needsNameUpdate) {
            router.replace('/onboarding/name');
            return;
          }

          if (!sessionStorage.getItem('braudle_welcomed')) {
            setShowWelcome(true);
            sessionStorage.setItem('braudle_welcomed', 'true');
            setTimeout(() => {
              setShowWelcome(false);
            }, 2500);
          }
        }
      } catch (err) {
        console.error('Failed to authenticate:', err);
        router.replace('/login');
        return;
      }
      
      // Fetch documents
      try {
        const docsRes = await api.get<any>('/documents');
        if (Array.isArray(docsRes)) {
           setDocuments(docsRes);
        }
      } catch(err) {
        console.error('Failed to fetch documents', err);
      }

      setLoading(false);
    }
    initDashboard();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router, setUser]);

  const pollDocumentStatus = async (docId: string) => {
    try {
      const res = await api.get<any>(`/documents/${docId}/status`);
      const { processingStatus, processingStage } = res;

      if (processingStatus === 'ready') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setUploadProgress({
          status: 'ready',
          documentId: docId,
          stage: 'ready',
          step: 6,
          error: null
        });
        
        // Refresh documents
        const docsRes = await api.get<any>('/documents');
        if (Array.isArray(docsRes)) {
           setDocuments(docsRes);
        }
        
        setTimeout(() => {
           setUploadProgress({ status: 'idle', documentId: null, stage: '', step: 0, error: null });
        }, 3000);
      } else if (processingStatus === 'failed') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setUploadProgress((prev) => ({ ...prev, status: 'failed', stage: 'failed', error: 'AI processing failed. Please try another file.' }));
      } else {
        // processing
        const stageInfo = UPLOAD_STAGES[processingStage as keyof typeof UPLOAD_STAGES] || UPLOAD_STAGES.file_received;
        setUploadProgress((prev) => ({
          ...prev,
          status: 'processing',
          stage: processingStage,
          step: stageInfo.step
        }));
      }
    } catch (err) {
      console.error('Error polling status:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      setUploadProgress({ status: 'failed', documentId: null, stage: '', step: 0, error: 'File size must be under 50MB' });
      return;
    }

    setIsUploading(true);
    setUploadProgress({ status: 'uploading', documentId: null, stage: 'uploading', step: 0, error: null });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);

    try {
      const res = await api.post<any>('/documents/upload', formData);
      if (res.documentId) {
        setUploadProgress({
          status: 'processing',
          documentId: res.documentId,
          stage: 'file_received',
          step: 1,
          error: null
        });
        
        // Start polling
        pollingRef.current = setInterval(() => {
          pollDocumentStatus(res.documentId);
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setUploadProgress({ status: 'failed', documentId: null, stage: '', step: 0, error: err.message || 'Upload failed' });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F6F7F2]">
        <div className="w-8 h-8 rounded-lg bg-[#4A783A] flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 bg-[#C2E1A6] rounded-sm rotate-45" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F2] font-sans text-[#1B3B2B] flex flex-col pb-24">
      {/* Welcome Motion Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A783A]"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-16 h-16 bg-[#F6F7F2] rounded-2xl flex items-center justify-center shadow-lg">
                <div className="w-8 h-8 bg-[#4A783A] rounded-md rotate-45" />
              </div>
              <h1 className="text-4xl md:text-5xl font-serif text-white tracking-tight">
                Welcome to Braudle
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-[#E5E7DF] bg-[#F6F7F2] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#4A783A] rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-[#C2E1A6] rounded-sm rotate-45" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Braudle</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="relative text-[#4A783A] hover:text-[#1B3B2B] transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F6F7F2]"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-[#E5E7DF] overflow-hidden border border-[#D1D5C9]">
             {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-medium text-[#4A783A]">
                   {user?.name?.charAt(0) || 'S'}
                </div>
             )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pt-6 max-w-lg mx-auto w-full">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-serif font-medium tracking-tight mb-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}.
          </h1>
          <p className="text-[#6B7280] text-[15px]">
            Ready to master new concepts today?
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-[#9CA3AF]" />
          </div>
          <input 
            type="text" 
            placeholder="Search topics, notes..." 
            className="w-full bg-white border border-[#E5E7DF] rounded-full py-3.5 pl-12 pr-4 text-[15px] focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] transition-colors shadow-sm placeholder:text-[#9CA3AF]"
          />
        </div>

        {/* Current Focus Card - Display the first active or recent document if available */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E7DF] p-5 mb-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Current Focus</span>
              <span className="bg-[#EDF5E8] text-[#4A783A] text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#4A783A] rounded-full"></span>
                Active
              </span>
            </div>

            <h2 className="text-xl font-serif font-medium mb-1 line-clamp-1">{documents[0].title}</h2>
            <p className="text-[#6B7280] text-[13px] mb-4">Subject: {documents[0].subject || 'General'}</p>

            <div className="w-full aspect-[2/1] bg-[#FAFAFA] rounded-xl border border-dashed border-[#E5E7DF] flex items-center justify-center mb-5 overflow-hidden">
               {documents[0].processingStatus === 'ready' ? (
                 <div className="text-[#4A783A] flex flex-col items-center">
                   <BookOpen className="w-8 h-8 mb-2" />
                   <span className="text-xs font-medium">Ready to study</span>
                 </div>
               ) : (
                 <div className="text-[#D1D5C9]">
                   <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                   </svg>
                 </div>
               )}
            </div>

            <button 
               onClick={() => router.push(`/session/${documents[0]._id || documents[0].id}`)}
               disabled={documents[0].processingStatus !== 'ready'}
               className="w-full bg-[#4A783A] hover:bg-[#3D6330] text-white rounded-xl py-3.5 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue Learning <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Upload Card */}
        <div className={`bg-white rounded-2xl border ${uploadProgress.status === 'processing' ? 'border-[#4A783A]' : 'border-[#E5E7DF]'} p-5 shadow-sm relative overflow-hidden group`}>
          {uploadProgress.status === 'idle' || uploadProgress.status === 'failed' ? (
            <>
              <input 
                type="file" 
                accept=".pdf,image/png,image/jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EDF5E8] rounded-xl flex items-center justify-center text-[#4A783A] group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[16px] mb-0.5">Upload new material</h3>
                  <p className="text-[13px] text-[#6B7280]">PDFs, images, or lecture slides</p>
                  {uploadProgress.error && (
                    <p className="text-[12px] text-red-500 mt-1 font-medium">{uploadProgress.error}</p>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full border border-[#E5E7DF] flex items-center justify-center text-[#4A783A]">
                  <Plus className="w-4 h-4" />
                </div>
              </div>
            </>
          ) : uploadProgress.status === 'ready' ? (
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EDF5E8] rounded-xl flex items-center justify-center text-[#4A783A]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[16px] mb-0.5 text-[#4A783A]">Document Ready!</h3>
                  <p className="text-[13px] text-[#6B7280]">AI Tutor is fully prepared.</p>
                </div>
              </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#EDF5E8] rounded-xl flex items-center justify-center text-[#4A783A]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[16px] mb-0.5">
                    {uploadProgress.status === 'uploading' ? 'Uploading file...' : 'Processing document...'}
                  </h3>
                  <p className="text-[13px] text-[#6B7280]">
                    {uploadProgress.status === 'uploading' ? 'Please wait' : (UPLOAD_STAGES[uploadProgress.stage as keyof typeof UPLOAD_STAGES]?.label || 'Analyzing...')}
                  </p>
                </div>
                <div className="text-[12px] font-semibold text-[#4A783A]">
                  {uploadProgress.step} / 6
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-[#E5E7DF] rounded-full overflow-hidden mt-1">
                <div 
                  className="h-full bg-[#4A783A] transition-all duration-500 ease-out"
                  style={{ width: `${(uploadProgress.step / 6) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#F6F7F2] border-t border-[#E5E7DF] px-6 py-2 pb-safe z-50">
        <div className="max-w-lg mx-auto flex items-center justify-between relative">
          <button className="flex flex-col items-center gap-1 p-2 text-[#4A783A]">
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-[#9CA3AF] hover:text-[#4A783A] transition-colors">
            <BookOpen className="w-6 h-6" />
            <span className="text-[10px] font-medium">Library</span>
          </button>
          
          <div className="relative -top-5">
            <button className="w-14 h-14 bg-[#4A783A] rounded-full flex items-center justify-center text-white shadow-lg shadow-[#4A783A]/30 hover:bg-[#3D6330] transition-colors hover:scale-105 active:scale-95">
              <Bot className="w-7 h-7" />
            </button>
          </div>

          <button className="flex flex-col items-center gap-1 p-2 text-[#9CA3AF] hover:text-[#4A783A] transition-colors">
            <GraduationCap className="w-6 h-6" />
            <span className="text-[10px] font-medium">Practice</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 text-[#9CA3AF] hover:text-[#4A783A] transition-colors">
            <Settings className="w-6 h-6" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

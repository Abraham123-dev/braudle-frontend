'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Loader2, BookOpen, Target, Brain, ChevronRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    level: 'beginner',
    studyLevel: '',
    learningStyle: 'explain_first',
    goal: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/profile/setup', formData);
      // On success, go to dashboard
      router.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to complete profile setup.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F2] font-sans text-[#1B3B2B] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[32px] border border-[#E5E7DF] shadow-sm p-8 animate-in slide-in-from-bottom-4 fade-in duration-500">
        
        <div className="mb-8 text-center">
           <div className="w-12 h-12 bg-[#4A783A] rounded-xl flex items-center justify-center mx-auto mb-4">
             <div className="w-6 h-6 bg-[#C2E1A6] rounded-md rotate-45" />
           </div>
           <h1 className="text-2xl font-serif font-medium mb-2">Build your AI Tutor</h1>
           <p className="text-[#6B7280] text-sm">Help Braudle adapt perfectly to how you learn.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Current Level */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4A783A] uppercase tracking-wider">
              <Brain className="w-4 h-4" /> Base Knowledge
            </label>
            <select
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: e.target.value })}
              className="w-full bg-[#F6F7F2] border border-[#E5E7DF] rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] transition-colors appearance-none"
            >
              <option value="beginner">Beginner (Explain everything)</option>
              <option value="intermediate">Intermediate (I know the basics)</option>
              <option value="advanced">Advanced (Deep technical details)</option>
            </select>
          </div>

          {/* Study Level */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4A783A] uppercase tracking-wider">
              <BookOpen className="w-4 h-4" /> Academic Level
            </label>
            <input
              type="text"
              placeholder="e.g. University Year 1, High School Senior"
              value={formData.studyLevel}
              onChange={(e) => setFormData({ ...formData, studyLevel: e.target.value })}
              required
              className="w-full bg-[#F6F7F2] border border-[#E5E7DF] rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] transition-colors placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Learning Style */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4A783A] uppercase tracking-wider">
              <Brain className="w-4 h-4" /> Learning Style
            </label>
            <select
              value={formData.learningStyle}
              onChange={(e) => setFormData({ ...formData, learningStyle: e.target.value })}
              className="w-full bg-[#F6F7F2] border border-[#E5E7DF] rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] transition-colors appearance-none"
            >
              <option value="explain_first">Explain first, then quiz me</option>
              <option value="socratic">Socratic method (Ask me questions)</option>
              <option value="analogies">Use lots of real-world analogies</option>
            </select>
          </div>

          {/* Goal */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-[#4A783A] uppercase tracking-wider">
              <Target className="w-4 h-4" /> Main Goal
            </label>
            <input
              type="text"
              placeholder="e.g. Pass JAMB Biology, Ace my finals"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              required
              className="w-full bg-[#F6F7F2] border border-[#E5E7DF] rounded-xl px-4 py-3.5 text-[15px] focus:outline-none focus:border-[#4A783A] focus:ring-1 focus:ring-[#4A783A] transition-colors placeholder:text-[#9CA3AF]"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-3 rounded-lg">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4A783A] hover:bg-[#3D6330] text-white rounded-xl py-4 font-medium flex items-center justify-center gap-2 transition-colors mt-4 disabled:opacity-50 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
               <>Start Studying <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

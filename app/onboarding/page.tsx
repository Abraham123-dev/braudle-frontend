'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { auth, User } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, CheckCircle2, User as UserIcon, BookOpen, GraduationCap, Compass, Target } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  
  // Local wizard steps
  // Step 1: Name (for email users)
  // Step 2: Learning Profile details
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [studyLevel, setStudyLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState('explain_first');
  const [goal, setGoal] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatically skip step 1 if user already has a name (e.g., Google OAuth users)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      if (!user.needsNameUpdate) {
        setStep(2);
      }
    }
  }, [user]);

  if (!user) return null;

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.patch<{ user: User; message: string }>('/auth/onboarding/name', { name });
      if (res.user) {
        auth.setCurrentUser(res.user);
        setUser(res.user);
        setStep(2);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Setup profile
      await api.post('/profile/setup', {
        level,
        studyLevel: studyLevel || 'High School / University',
        learningStyle,
        goal: goal || 'Deep understanding'
      });

      // 2. Fetch updated user details to reflect onboardingComplete = true
      const userRes = await api.get<{ user: User }>('/auth/me');
      if (userRes.user) {
        auth.setCurrentUser(userRes.user);
        setUser(userRes.user);
        router.replace('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-charcoal font-sans antialiased flex flex-col justify-center items-center p-6 sm:p-8">
      <div className="w-full max-w-xl">
        {/* Top Branding / Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 bg-brand-forest rounded-lg flex items-center justify-center mb-3">
            <div className="w-5 h-5 bg-brand-lime rounded-sm rotate-45" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Braudle Personalization</span>
        </div>

        {/* Form Container */}
        <div className="bg-white/5 border border-white/5 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl text-left relative overflow-hidden">
          {/* Progress Indicators */}
          <div className="flex gap-2 mb-8 items-center">
            {user.needsNameUpdate && (
              <>
                <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand-lime' : 'bg-white/10'}`} />
                <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand-lime' : 'bg-white/10'}`} />
              </>
            )}
            {!user.needsNameUpdate && (
              <div className="h-1.5 flex-1 rounded-full bg-brand-lime" />
            )}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && user.needsNameUpdate ? (
              <motion.div
                key="step-name"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-brand-lime" /> Let's collect your name
                  </h1>
                  <p className="text-xs text-gray-400 mt-2">
                    Please provide your real name or nickname so your AI tutor knows how to address you.
                  </p>
                </div>

                <form onSubmit={handleNameSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="student-name" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="student-name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Daniel Alade"
                      className="w-full rounded-full border border-white/10 bg-white/5 py-4 px-6 text-[14px] text-white placeholder-white/30 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-green py-4 px-6 text-[15px] font-semibold text-white hover:bg-brand-green/80 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Continue to Profile Setup
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="step-profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-brand-lime" /> Personalize your AI tutor
                  </h1>
                  <p className="text-xs text-gray-400 mt-2">
                    Tailor your Socratic teacher to align with your academic level, style, and goals.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-5">
                  {/* Select Level */}
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Academic Level / Depth
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLevel(lvl)}
                          className={`py-3.5 px-4 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                            level === lvl
                              ? 'bg-brand-lime border-brand-lime text-brand-forest shadow-md'
                              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Study Level Input */}
                  <div>
                    <label htmlFor="study-level" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Current Grade / Year of Study
                    </label>
                    <input
                      type="text"
                      id="study-level"
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      placeholder="e.g. University Year 1, High School Senior"
                      className="w-full rounded-full border border-white/10 bg-white/5 py-4 px-6 text-[14px] text-white placeholder-white/30 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime transition-all"
                    />
                  </div>

                  {/* Learning Style */}
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      Preferred Learning Method
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: 'explain_first', label: 'Step-by-step first', desc: 'Detailed explanations first' },
                        { id: 'analogy', label: 'Use Analogies', desc: 'Real-world visual comparisons' },
                        { id: 'socratic', label: 'Socratic Prompting', desc: 'Guide me by asking questions' }
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setLearningStyle(style.id)}
                          className={`flex items-center justify-between p-4 rounded-2xl text-left border transition-all ${
                            learningStyle === style.id
                              ? 'bg-brand-lime/10 border-brand-lime text-white'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-semibold block">{style.label}</span>
                            <span className="text-[10px] opacity-75">{style.desc}</span>
                          </div>
                          {learningStyle === style.id && <CheckCircle2 className="w-5 h-5 text-brand-lime" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Core Goal */}
                  <div>
                    <label htmlFor="goal" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                      What is your study goal? (Optional)
                    </label>
                    <input
                      type="text"
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Pass JAMB Biology, Master Organic Chemistry"
                      className="w-full rounded-full border border-white/10 bg-white/5 py-4 px-6 text-[14px] text-white placeholder-white/30 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime transition-all"
                    />
                  </div>

                  {error && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-2xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-full bg-brand-lime py-4 px-6 text-[15px] font-bold text-brand-forest hover:bg-brand-lime/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Complete Profile & Launch Dashboard
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}

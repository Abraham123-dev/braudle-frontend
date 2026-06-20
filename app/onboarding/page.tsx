'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { auth, User } from '@/lib/auth';
import { 
  Sparkles, 
  ChevronRight, 
  GraduationCap, 
  BookOpen, 
  Target, 
  Bookmark, 
  HelpCircle,
  Check
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  // Screen/step states
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Name input (for email users)
  const [name, setName] = useState('');

  // Step 2: Profile customization states
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [studyLevel, setStudyLevel] = useState('');
  const [learningStyle, setLearningStyle] = useState('explain_first');
  const [goal, setGoal] = useState('');

  // Initialize name from user if available
  useEffect(() => {
    if (user?.name && user.name !== 'New Student') {
      setName(user.name);
    }
  }, [user]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // If Google user or name already set, we just proceed to step 2
    if (!user?.needsNameUpdate) {
      setStep(2);
      return;
    }

    if (!name || name.trim().length < 2) {
      setError('Please enter a name with at least 2 characters.');
      return;
    }

    if (name.trim().toLowerCase() === 'new student') {
      setError('Please choose a personalized name.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.patch<{ user: User; message: string }>('/auth/onboarding/name', {
        name: name.trim()
      });
      if (response.user) {
        auth.setCurrentUser(response.user);
        setUser(response.user);
        setStep(2);
      } else {
        throw new Error('Failed to update name.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while setting your name.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Submit customization parameters to /profile/onboarding
      await api.post('/profile/onboarding', {
        level,
        studyLevel: studyLevel || 'Self-Taught',
        learningStyle,
        goal: goal || 'Deep understanding'
      });

      // 2. Fetch the fresh user session with onboardingComplete = true
      const authRes = await api.get<{ user: User }>('/auth/me');
      
      if (authRes.user) {
        auth.setCurrentUser(authRes.user);
        setUser(authRes.user);
        
        // 3. Complete and redirect to home learning space
        router.replace('/home');
      } else {
        throw new Error('Session details could not be updated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete tutor setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-brand-forest font-sans flex flex-col justify-between selection:bg-brand-lime selection:text-brand-green">
        {/* Simple Header */}
        <header className="border-b border-gray-100 py-5 px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/home" className="font-semibold text-xl tracking-tight text-brand-green">
                Braudle
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-green">
                Setup
              </span>
              <span className="text-xs text-gray-400 font-medium">
                — Step {step} of 2
              </span>
            </div>
          </div>
        </header>

        {/* Core Card Container */}
        <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="max-w-2xl w-full">
            {/* Step Progress Bar */}
            <div className="w-full bg-gray-100 h-1 rounded-full mb-10 overflow-hidden">
              <div 
                className="bg-brand-green h-full transition-all duration-500 ease-out" 
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>

            {step === 1 ? (
              /* SCREEN 1: GREETING & NAME COLLECTION */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-4">
                  <div className="inline-flex p-3 bg-brand-green/5 text-brand-green rounded-2xl border border-brand-green/10">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-brand-forest leading-tight">
                    {user?.needsNameUpdate 
                      ? "Hi there! I'm Braudle, your personal learning companion."
                      : `Hi ${name || user?.name || ''}! I'm Braudle, your personal learning companion.`
                    }
                  </h1>
                  <p className="text-brand-forest/70 text-[15px] leading-relaxed max-w-xl">
                    Rather than just giving you quick answers, I'm here to help you truly master your subjects. 
                    I study your materials, explain complex ideas with analogies, test you with adaptive practice questions, 
                    and prep you for mock exams.
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-6">
                  {user?.needsNameUpdate ? (
                    <div className="space-y-2.5 max-w-md">
                      <label className="text-xs font-bold uppercase tracking-wider text-brand-forest/60 block">
                        What would you like me to call you?
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name or nickname"
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-4 px-5 text-[15px] font-medium text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                        maxLength={50}
                      />
                    </div>
                  ) : (
                    <p className="text-[13px] text-gray-500 font-medium">
                      Let's set up your personalized study parameters.
                    </p>
                  )}

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-2xl max-w-md">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center gap-2 rounded-2xl bg-brand-green py-4 px-8 text-[15px] font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    {loading ? 'Saving name...' : user?.needsNameUpdate ? (
                      <>
                        Continue
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    ) : (
                      <>
                        Start Customizing
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* SCREEN 2: TUTOR CUSTOMIZATION */
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-brand-forest">
                    Let's personalize your AI tutor
                  </h1>
                  <p className="text-sm text-gray-500">
                    These settings help me tailor explanation depths, pacing, and questions to you.
                  </p>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-8">
                  {/* 1. Academic Level */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-brand-green" /> Academic level
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { 
                          value: 'beginner', 
                          title: 'Beginner', 
                          desc: 'Focus on foundations, simple analogies, and core ideas.' 
                        },
                        { 
                          value: 'intermediate', 
                          title: 'Intermediate', 
                          desc: 'Balance details, applications, and practical challenges.' 
                        },
                        { 
                          value: 'advanced', 
                          title: 'Advanced', 
                          desc: 'Deep technical analysis, rigorous terms, and exam mockups.' 
                        }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setLevel(item.value as any)}
                          className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative h-full min-h-[120px] ${
                            level === item.value 
                              ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-sm text-brand-forest">{item.title}</span>
                            {level === item.value && (
                              <span className="w-4 h-4 bg-brand-green rounded-full flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed font-normal">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Study Level (Grade/Year) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-brand-green" /> What grade or year of study are you in?
                    </label>
                    <input
                      type="text"
                      required
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      placeholder="e.g., Grade 11, University Year 1, Self-Taught"
                      className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 px-5 text-[14px] font-medium text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['High School', 'University Year 1', 'University Year 3', 'Graduate School', 'Self-Taught'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setStudyLevel(suggestion)}
                          className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-brand-forest/70 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Learning Style */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-brand-green" /> Preferred learning style
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { 
                          value: 'socratic', 
                          title: 'Socratic Guide', 
                          desc: 'Guide me with hints and questions rather than straight answers.' 
                        },
                        { 
                          value: 'explain_first', 
                          title: 'Concept First', 
                          desc: 'Provide comprehensive explanations with analogies first.' 
                        },
                        { 
                          value: 'practice_first', 
                          title: 'Active Practice', 
                          desc: 'Start with tests/questions and review theory afterwards.' 
                        }
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setLearningStyle(item.value)}
                          className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative h-full min-h-[120px] ${
                            learningStyle === item.value 
                              ? 'border-brand-green bg-brand-green/5 ring-1 ring-brand-green' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-sm text-brand-forest">{item.title}</span>
                            {learningStyle === item.value && (
                              <span className="w-4 h-4 bg-brand-green rounded-full flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed font-normal">
                            {item.desc}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Ultimate Goal */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-brand-green" /> What is your primary learning goal?
                    </label>
                    <input
                      type="text"
                      required
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g., Pass JAMB Biology, Master quantum physics, Learn coding"
                      className="w-full max-w-md rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 px-5 text-[14px] font-medium text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-green transition-all"
                    />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['Pass my exams', 'Deconstruct concepts deeply', 'Prepare for a job', 'Self-improvement'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setGoal(suggestion)}
                          className="px-3.5 py-1.5 rounded-full border border-gray-200 text-xs font-medium text-brand-forest/70 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-2xl">
                      {error}
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-6 py-4 rounded-2xl border border-gray-200 text-[14px] font-bold text-brand-forest hover:bg-gray-50 transition-all cursor-pointer active:scale-[0.98]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-2xl bg-brand-green py-4 px-8 text-[15px] font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      {loading ? 'Finalizing setup...' : (
                        <>
                          Complete Setup
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </main>

        {/* Simple Footer */}
        <footer className="border-t border-gray-100 py-6 px-6 bg-gray-50/50">
          <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-gray-400">
            <span>© 2026 Braudle. All rights reserved.</span>
            <div className="flex gap-4">
              <a href="/terms" className="hover:underline">Terms of Use</a>
              <a href="/privacy" className="hover:underline">Privacy Policy</a>
            </div>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}

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
  HelpCircle,
  Check,
  MessageSquare,
  Network,
  Zap,
  CheckCircle2,
  Bookmark,
  Briefcase,
  Trophy,
  Compass,
  Flame,
  Award
} from 'lucide-react';

import Logo from '@/components/Logo';

interface MotivationOption {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  icon: any;
}

interface TargetOption {
  minutes: number;
  label: string;
  desc: string;
  icon: any;
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  // Screen/step states: 1 = Name, 2 = Grade/Subject, 3 = Motivation, 4 = Time Commitment
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');

  // Step 2 states
  const [studyLevel, setStudyLevel] = useState('');
  const [goal, setGoal] = useState(''); // Stores the study subject/topic (e.g. Biology)

  // Step 3 states (Motivation)
  const [motivation, setMotivation] = useState('deep_understanding');

  // Step 4 states (Daily time commitment)
  const [dailyStudyTarget, setDailyStudyTarget] = useState(15);

  // Defaults (hidden from UI, handled automatically)
  const [level] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [learningStyle] = useState('explain_first');

  // Determine starting step and initialize name
  useEffect(() => {
    if (user?.name && user.name !== 'New Student') {
      setName(user.name);
    }
    if (user && !user.needsNameUpdate) {
      setStep(2);
    }
  }, [user]);

  // Adjust step indicators based on whether Step 1 is required
  const hasStep1 = user?.needsNameUpdate;
  const totalSteps = hasStep1 ? 4 : 3;
  const currentStepDisplay = hasStep1 ? step : step - 1;

  const motivationOptions: MotivationOption[] = [
    { 
      id: 'exam_prep', 
      title: 'Ace my exams', 
      desc: 'Study for high scores and upcoming tests', 
      emoji: '🎓', 
      icon: Trophy 
    },
    { 
      id: 'career_growth', 
      title: 'Prepare for a career', 
      desc: 'Upskill, learn coding, or prepare for interviews', 
      emoji: '💼', 
      icon: Briefcase 
    },
    { 
      id: 'deep_understanding', 
      title: 'Deepen my understanding', 
      desc: 'Break down complex topics and master concepts', 
      emoji: '🧠', 
      icon: Target 
    },
    { 
      id: 'hobby', 
      title: 'Explore a personal interest', 
      desc: 'Satisfy curiosity and learn something new', 
      emoji: '🌱', 
      icon: Compass 
    }
  ];

  const targetOptions: TargetOption[] = [
    { 
      minutes: 5, 
      label: 'Casual review', 
      desc: '5 minutes / day', 
      icon: Compass 
    },
    { 
      minutes: 15, 
      label: 'Focused study', 
      desc: '15 minutes / day', 
      icon: Flame 
    },
    { 
      minutes: 30, 
      label: 'Intense learning', 
      desc: '30 minutes / day', 
      icon: Zap 
    }
  ];

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studyLevel.trim()) {
      setError('Please tell us what level of study you are at.');
      return;
    }

    if (!goal.trim()) {
      setError('Please tell us what subject you want to learn first.');
      return;
    }

    setStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(4);
  };

  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Submit customization parameters to /profile/onboarding
      await api.post('/profile/onboarding', {
        level,
        studyLevel: studyLevel.trim(),
        learningStyle,
        goal: goal.trim(),
        motivation,
        dailyStudyTarget
      });

      // 2. Fetch the fresh user session with onboardingComplete = true
      const authRes = await api.get<{ user: User }>('/auth/me');
      
      if (authRes.user) {
        auth.setCurrentUser(authRes.user);
        setUser(authRes.user);
        
        // 3. Set success state to show final screen
        setShowSuccess(true);
      } else {
        throw new Error('Session details could not be updated.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to complete tutor setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to fetch the readable title of the chosen motivation
  const getSelectedMotivationTitle = () => {
    return motivationOptions.find(o => o.id === motivation)?.title || 'deep understanding';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white text-brand-forest font-sans grid grid-cols-1 lg:grid-cols-[65fr_35fr] selection:bg-brand-lime selection:text-brand-green">
        
        {/* LEFT COLUMN: INTERACTIVE FORM (65% width) */}
        <div className="w-full flex flex-col justify-between p-6 md:p-12 border-r border-gray-100 bg-white relative z-10">
          {/* Header */}
          <header className="py-2 flex items-center justify-between">
            <Link href="/home" className="flex items-center gap-2 font-semibold text-xl tracking-tight text-brand-green">
              <Logo size={24} className="shrink-0" />
              <span>Braudle</span>
            </Link>
            <div className="text-right">
              {showSuccess ? (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-green bg-brand-green/10 px-2.5 py-1 rounded-full">
                  Setup Complete
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-green/80 bg-brand-green/10 px-2.5 py-1 rounded-full">
                  Step {currentStepDisplay} of {totalSteps}
                </span>
              )}
            </div>
          </header>

          {/* Form Content */}
          <div className="my-auto py-10 max-w-2xl w-full mx-auto space-y-8">
            {showSuccess ? (
              /* SUCCESS COMPLETION SCREEN (WhatsApp-style Animated Emoji) */
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 text-center my-auto max-w-sm mx-auto flex flex-col items-center">
                {/* CSS keyframe inject */}
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes whatsappEmojiPulse {
                    0%, 100% { transform: scale(1) translateY(0) rotate(0deg); }
                    50% { transform: scale(1.15) translateY(-14px) rotate(6deg); }
                  }
                  .whatsapp-emoji-live {
                    display: inline-block;
                    animation: whatsappEmojiPulse 1.8s ease-in-out infinite;
                  }
                `}} />

                <div className="relative inline-block py-6">
                  <span className="text-8xl select-none filter drop-shadow-md whatsapp-emoji-live">🥳</span>
                  <div className="absolute inset-0 bg-brand-lime/10 rounded-full blur-xl scale-75 -z-10 animate-pulse" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight text-brand-forest">
                    Great, {name.trim() || 'Student'}!
                  </h1>
                  <p className="text-zinc-500 text-xs font-semibold leading-relaxed">
                    You are all set up for Braudle. Head over to your learning space to start your Socratic study session.
                  </p>
                </div>

                <button
                  onClick={() => router.replace('/home')}
                  className="group w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green py-3.5 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <span>Go to Learning Space</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ) : step === 1 ? (
              /* STEP 1: WELCOME & NAME */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <div className="space-y-3">
                  <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-brand-forest leading-[1.1]">
                    Welcome to your personal AI study space.
                  </h1>
                  <p className="text-zinc-500 text-xs font-normal leading-relaxed">
                    Braudle studies your files, builds visual concept maps, and guides you with Socratic tutoring. Let's get set up.
                  </p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/65 block">
                      What should we call you?
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your first name or nickname"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 px-4 text-xs font-normal text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/10 transition-all"
                      maxLength={50}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-bold rounded-xl animate-shake">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green py-3.5 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </form>
              </div>
            ) : step === 2 ? (
              /* STEP 2: STUDY TOPIC & GRADE */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-brand-forest leading-[1.1]">
                    Tell us about your studies
                  </h1>
                  <p className="text-zinc-500 text-xs font-normal">
                    We tailor explanations and study plans to your grade and topic.
                  </p>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-5">
                  {/* Grade / Study Level */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/65 block">
                      What grade or level are you in?
                    </label>
                    <input
                      type="text"
                      required
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      placeholder="e.g. High School, College, Self-Learner"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 px-4 text-xs font-normal text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/10 transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {['High School', 'College', 'Self-Learner'].map((levelChoice) => (
                        <button
                          key={levelChoice}
                          type="button"
                          onClick={() => setStudyLevel(levelChoice)}
                          className="px-3 py-1 rounded-full border border-gray-200/80 text-[10px] font-semibold text-gray-500 bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                        >
                          {levelChoice}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject or Topic */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-brand-forest/65 block">
                      What subject or topic are you studying?
                    </label>
                    <input
                      type="text"
                      required
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Biology, Calculus, Coding, World History"
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50/50 py-3.5 px-4 text-xs font-normal text-brand-forest placeholder-gray-400 focus:border-brand-green focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-green/10 transition-all"
                    />
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      {['Biology', 'Calculus', 'World History'].map((goalChoice) => (
                        <button
                          key={goalChoice}
                          type="button"
                          onClick={() => setGoal(goalChoice)}
                          className="px-3 py-1 rounded-full border border-gray-200/80 text-[10px] font-semibold text-gray-500 bg-white hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                        >
                          {goalChoice}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-bold rounded-xl animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    {hasStep1 && (
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="px-5 py-3.5 rounded-2xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 group inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green py-3.5 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            ) : step === 3 ? (
              /* STEP 3: MOTIVATION / GOAL SETTING */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-brand-forest leading-[1.1]">
                    What are you trying to achieve?
                  </h1>
                  <p className="text-zinc-500 text-xs font-normal">
                    This shapes how the tutor highlights key concepts and praises your progress.
                  </p>
                </div>

                <form onSubmit={handleStep3Submit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {motivationOptions.map((option) => {
                      const isSelected = motivation === option.id;
                      const Icon = option.icon;
                      return (
                        <div
                          key={option.id}
                          onClick={() => setMotivation(option.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 select-none ${
                            isSelected 
                              ? 'border-brand-green bg-brand-green/[0.02] shadow-3xs' 
                              : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-brand-green/10 text-brand-green' : 'bg-zinc-150/50 text-zinc-500'}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="font-bold text-xs text-brand-forest block">
                              {option.title}
                            </span>
                            <span className="text-[10px] text-zinc-400 block leading-normal font-medium">
                              {option.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-4.5 h-4.5 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 mt-2">
                              <Check className="w-2.5 h-2.5 stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-3.5 rounded-2xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 group inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green py-3.5 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* STEP 4: HABIT LOOP / DAILY target TIME COMMITMENT */
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-[40px] font-semibold tracking-tight text-brand-forest leading-[1.1]">
                    What is your daily study target?
                  </h1>
                  <p className="text-zinc-500 text-xs font-normal">
                    Setting a daily commitment makes it easier to build a consistent learning routine.
                  </p>
                </div>

                <form onSubmit={handleStep4Submit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {targetOptions.map((option) => {
                      const isSelected = dailyStudyTarget === option.minutes;
                      const Icon = option.icon;
                      return (
                        <div
                          key={option.minutes}
                          onClick={() => setDailyStudyTarget(option.minutes)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 select-none ${
                            isSelected 
                              ? 'border-brand-green bg-brand-green/[0.02] shadow-3xs' 
                              : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 bg-white'
                          }`}
                        >
                          <div className={`p-2.5 rounded-xl shrink-0 ${isSelected ? 'bg-brand-green/10 text-brand-green' : 'bg-zinc-150/50 text-zinc-500'}`}>
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <span className="font-bold text-xs text-brand-forest block">
                              {option.label}
                            </span>
                            <span className="text-[10px] text-zinc-400 block leading-normal font-medium">
                              {option.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-4.5 h-4.5 rounded-full bg-brand-green text-white flex items-center justify-center shrink-0 mt-2">
                              <Check className="w-2.5 h-2.5 stroke-[3px]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[10px] font-bold rounded-xl animate-shake">
                      {error}
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-5 py-3.5 rounded-2xl border border-gray-200 text-xs font-bold text-brand-forest hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 group inline-flex items-center justify-center gap-1.5 rounded-2xl bg-brand-green py-3.5 px-6 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      <span>{loading ? 'Setting up your tutor...' : 'Start Learning'}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="py-2 text-[10px] text-gray-400 font-semibold flex justify-between tracking-wide select-none">
            <span>© 2026 Braudle</span>
            <div className="flex gap-3">
              <a href="/terms" className="hover:underline">Terms</a>
              <a href="/privacy" className="hover:underline">Privacy</a>
            </div>
          </footer>
        </div>

        {/* RIGHT COLUMN: DRIBBBLE-STYLE INTERACTIVE PREVIEW PANEL (70% width) */}
        <div className="w-full hidden lg:flex flex-col items-center justify-center bg-[#F6F7F2] p-12 overflow-hidden relative select-none">
          {/* Decorative geometric background spots */}
          <div className="absolute top-10 right-10 w-48 h-48 bg-brand-green/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-brand-lime/10 rounded-full blur-3xl pointer-events-none" />

          {/* Main Floating Glass-morphic Widget Container */}
          <div className="max-w-2xl w-full bg-white rounded-3xl border border-zinc-200/60 shadow-lg p-8 space-y-6 relative overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95 duration-500">
            
            {/* Header bar */}
            <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
              <div className="w-6.5 h-6.5 rounded-lg bg-brand-green flex items-center justify-center text-white shrink-0">
                <Logo size={14} className="shrink-0" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-[10.5px] text-brand-forest">Braudle Personal Tutor</h4>
                <span className="text-[7.5px] text-brand-green font-bold uppercase tracking-wider">Online</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[9.5px] font-bold text-brand-forest">+50 XP</span>
              </div>
            </div>

            {/* Conversation Area with states dynamic mapping */}
            <div className="space-y-4 text-left py-2 min-h-[220px] flex flex-col justify-end">
              
              {/* Message 1: Initial Greeting */}
              <div className="flex items-start gap-2.5 max-w-[85%] animate-in fade-in duration-300">
                <div className="w-5.5 h-5.5 rounded-md bg-[#3D5F30]/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare className="w-3 h-3" />
                </div>
                <div className="bg-[#E2E6DD]/30 border border-zinc-250/20 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[10.5px] font-semibold text-brand-forest leading-relaxed">
                  Hey! I'm Braudle. I will study your learning materials, design Socratic analogies, and tutor you. What should I call you?
                </div>
              </div>

              {/* Message 2: Name Response */}
              {name.trim() && (
                <div className="flex items-start gap-2.5 max-w-[85%] ml-auto justify-end animate-in fade-in duration-300">
                  <div className="bg-brand-green text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-[10.5px] font-bold shadow-3xs">
                    {name.trim()}
                  </div>
                </div>
              )}

              {/* Message 3: Subject & Grade Level acknowledgement */}
              {step >= 3 && goal.trim() && (
                <div className="flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-5.5 h-5.5 rounded-md bg-[#3D5F30]/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <div className="bg-[#E2E6DD]/30 border border-zinc-250/20 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[10.5px] font-semibold text-brand-forest leading-relaxed">
                    Great to meet you, <span className="font-bold text-brand-green">{name.trim()}</span>! Let's build a study plan for <span className="font-bold text-brand-green">{goal.trim()}</span> tailored for a <span className="font-semibold text-brand-forest">{studyLevel.trim() || 'student'}</span>. What is your end goal?
                  </div>
                </div>
              )}

              {/* Message 4: Motivation Selection bubble */}
              {step >= 4 && (
                <>
                  <div className="flex items-start gap-2.5 max-w-[85%] ml-auto justify-end animate-in fade-in duration-300">
                    <div className="bg-brand-green text-white px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-[10.5px] font-bold shadow-3xs">
                      {getSelectedMotivationTitle()}
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-5.5 h-5.5 rounded-md bg-[#3D5F30]/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-3 h-3" />
                    </div>
                    <div className="bg-[#E2E6DD]/30 border border-zinc-250/20 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[10.5px] font-semibold text-brand-forest leading-relaxed">
                      Got it! We'll center our <span className="font-bold text-brand-green">{goal.trim()}</span> sessions on helping you <span className="font-bold">{getSelectedMotivationTitle().toLowerCase()}</span>. Let's lock in a daily target of <span className="font-bold text-brand-green">{dailyStudyTarget} mins</span> to build consistency. Start Day 1?
                    </div>
                  </div>
                </>
              )}

              {/* Message 5: Celebratory workspace greeting */}
              {showSuccess && (
                <div className="flex items-start gap-2.5 max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="w-5.5 h-5.5 rounded-md bg-[#3D5F30]/10 text-brand-green flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <div className="bg-[#E2E6DD]/30 border border-zinc-250/20 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-[10.5px] font-semibold text-brand-forest leading-relaxed">
                    Tutor instances initialized. 🎉 Welcome to Braudle, <span className="font-bold text-brand-green">{name.trim()}</span>! Head over to your study space whenever you're ready to learn.
                  </div>
                </div>
              )}

            </div>

            {/* Dashboard Habit Loop Indicator */}
            <div className="bg-[#F6F7F2]/60 rounded-2xl p-4 border border-zinc-150/40 text-left grid grid-cols-3 gap-4">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">Grade Level</span>
                <span className="text-[10px] font-bold text-brand-forest block truncate mt-0.5">{studyLevel.trim() || 'Not set'}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">Topic Target</span>
                <span className="text-[10px] font-bold text-brand-green block truncate mt-0.5">{goal.trim() || 'Not set'}</span>
              </div>
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 block">Daily Target</span>
                <span className="text-[10px] font-bold text-amber-600 block truncate mt-0.5 flex items-center gap-1 mt-0.5">
                  <Flame className="w-3.5 h-3.5 fill-orange-400 text-orange-400 shrink-0" />
                  {dailyStudyTarget} mins
                </span>
              </div>
            </div>

          </div>

          {/* Subtext description below the widget */}
          <div className="mt-8 text-center max-w-sm">
            <h3 className="font-semibold text-xs text-brand-forest uppercase tracking-wider">
              {step <= 2 ? 'Meet your personal tutor' : 'Conversational Socratic tutoring'}
            </h3>
            <p className="text-[10px] text-gray-400 font-normal leading-relaxed mt-1">
              {step <= 2 
                ? 'Braudle responds conversationally, remembers your weak spots, and teaches until concepts click.'
                : "Braudle doesn't just give direct answers. It checks your understanding, guides with prompts, and adapts to you."
              }
            </p>
          </div>
        </div>

      </div>
    </ProtectedRoute>
  );
}

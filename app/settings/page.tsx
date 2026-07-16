'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { auth } from '@/lib/auth';
import Header from '@/components/dashboard/Header';
import { 
  ArrowLeft, Flame, Zap, BarChart3, BookOpen, Trophy, 
  Compass, Save, Shield, User, AlertCircle
} from 'lucide-react';

interface ProfileData {
  xp: number;
  streak: number;
  longestStreak: number;
  totalSessions: number;
  averageScore: number;
  goal?: string;
  level?: string;
  studyLevel?: string;
  learningStyle?: string;
  weeklyChallenge?: {
    description: string;
    target: number;
    progress: number;
    completed: boolean;
    xpReward: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable settings inputs
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [studyLevel, setStudyLevel] = useState('Self-Taught');
  const [learningStyle, setLearningStyle] = useState('interactive explanation');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get<any>('/profile');
        setProfile(res);
        if (res) {
          setGoal(res.goal || 'Deep understanding');
          setLevel(res.level || 'intermediate');
          setStudyLevel(res.studyLevel || 'Self-Taught');
          setLearningStyle(res.learningStyle || 'interactive explanation');
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const formData = new FormData();
      formData.append('level', level);
      formData.append('studyLevel', studyLevel);
      formData.append('learningStyle', learningStyle);
      formData.append('goal', goal);
      if (avatarFile) {
        formData.append('file', avatarFile);
      }

      // Save profile and avatar updates
      const res = await api.put<any>('/profile', formData);

      // Update fresh session user in state
      if (res.user) {
        auth.setCurrentUser(res.user);
        setUser(res.user);
      }

      // Update fresh profile state directly from response to save network latency
      if (res.profile) {
        setProfile(res.profile);
      }

      setSaveSuccess(true);
      setAvatarFile(null);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };



  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#F9FBFC] text-brand-forest font-sans flex flex-col">
        
        {/* Consistent Global Header */}
        <Header onUploadClick={() => router.push('/library')} />

        {/* Content Body */}
        <main className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-8 py-10">
          
          {/* Breadcrumb back navigation */}
          <div className="mb-6">
            <Link href="/library" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-brand-green transition-all uppercase tracking-wider">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Library
            </Link>
          </div>

          <div className="text-left mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-forest">
              Settings & Profile
            </h1>
            <p className="text-[11px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">
              Configure your personal AI tutor preferences and monitor academic statistics
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse select-none">
              <div className="md:col-span-2 bg-white rounded-3xl p-6 h-[450px] border border-gray-100" />
              <div className="bg-white rounded-3xl p-6 h-[450px] border border-gray-100" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT COLUMN: Tutoring Settings Form */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleSave} className="bg-white rounded-3xl border border-zinc-100 p-6 md:p-8 space-y-6 text-left shadow-3xs">
                  
                  {/* Profile Overview Row */}
                  <div className="flex items-center gap-3.5 border-b border-zinc-100 pb-5">
                    <div className="relative group cursor-pointer overflow-hidden rounded-full w-12 h-12 border border-brand-green/15 shrink-0 bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover animate-in fade-in duration-200" />
                      ) : user?.avatar ? (
                        <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(user?.name || '')
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-bold uppercase tracking-wider select-none">
                        Edit
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-sm text-brand-forest truncate">{user?.name}</h3>
                      <p className="text-[11px] text-gray-400 font-semibold truncate mt-0.5">{user?.email}</p>
                      <p className="text-[9px] text-brand-green font-bold uppercase tracking-wider mt-1 select-none">
                        Click picture to change avatar
                      </p>
                    </div>
                  </div>

                  {/* Onboarding updates feedback */}
                  {saveSuccess && (
                    <div className="bg-brand-green/10 border border-brand-green/20 text-brand-green rounded-xl p-3.5 text-xs font-bold text-center animate-in fade-in">
                      Preferences saved successfully! Your AI tutor is configured.
                    </div>
                  )}

                  {/* Academic Goal */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-brand-green" />
                      Academic Goal
                    </label>
                    <input
                      type="text"
                      required
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="e.g. Prep for finals, master thermodynamics..."
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-xs font-semibold text-brand-forest focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all placeholder-zinc-300"
                    />
                  </div>

                  {/* Study Level input */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-brand-forest/60 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-brand-green" />
                      Current Study Level / Grade
                    </label>
                    <input
                      type="text"
                      required
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      placeholder="e.g. Sophomore, Grade 11, Researcher..."
                      className="w-full px-4 py-3 border border-zinc-200 rounded-xl bg-white text-xs font-semibold text-brand-forest focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/10 transition-all placeholder-zinc-300"
                    />
                  </div>



                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-brand-green hover:bg-brand-green/90 text-white font-bold text-xs rounded-xl active:scale-[0.98] transition-all cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Updating...' : 'Update Profile & Settings'}</span>
                    </button>
                  </div>
                </form>

                {/* Security Card */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-3xs p-6 text-left flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-brand-forest">Data Protection & Privacy</h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                      Your uploaded documents, notebooks, and learning statistics are stored securely in cloud storage. Your AI tutoring instances verify notebook content privately and no source contents are shared.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Streak, XP and Weekly Challenges */}
              <div className="space-y-6">
                
                {/* 1. Day Streak Card */}
                <div className="bg-brand-forest text-white rounded-3xl p-6 shadow-xs relative overflow-hidden group">
                  <div className="absolute right-[-10px] top-[-10px] w-24 h-24 bg-brand-green/25 rounded-full blur-xl pointer-events-none" />
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                      <Flame className="w-4.5 h-4.5 text-orange-400 fill-orange-400" />
                    </div>
                    <span className="text-[9px] uppercase font-extrabold tracking-wider bg-brand-green text-white px-2.5 py-1 rounded-full">
                      Streak Active
                    </span>
                  </div>
                  <div className="mt-8 text-left">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {profile?.streak || 0}
                    </span>
                    <span className="text-sm font-bold opacity-80 ml-1.5">days</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-60 mt-1">
                      Current study streak
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/10 text-left text-[10px] font-bold opacity-85 flex justify-between uppercase tracking-wider">
                    <span className="opacity-60">Longest Streak</span>
                    <span>{profile?.longestStreak || 0} days</span>
                  </div>
                </div>

                {/* 2. XP & Score Stats Card */}
                <div className="bg-white rounded-3xl border border-zinc-100 shadow-3xs p-6 space-y-5">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-brand-forest/60 text-left">
                    Learning Statistics
                  </h4>

                  <div className="grid grid-cols-2 gap-3.5">
                    {/* XP Points */}
                    <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100/50 text-left flex flex-col justify-between min-h-[95px]">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xl font-black text-brand-forest block leading-none">
                          {profile?.xp || 0}
                        </span>
                        <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider mt-1 block">
                          Total XP
                        </span>
                      </div>
                    </div>

                    {/* Average Score */}
                    <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 text-left flex flex-col justify-between min-h-[95px]">
                      <div className="w-7 h-7 rounded-lg bg-brand-green text-white flex items-center justify-center">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xl font-black text-brand-forest block leading-none">
                          {profile?.averageScore || 0}%
                        </span>
                        <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider mt-1 block">
                          Avg Score
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/40 border border-blue-100/50 text-left">
                    <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0">
                      <BookOpen className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-brand-forest block">
                        {profile?.totalSessions || 0} study sessions
                      </span>
                      <span className="text-[9px] text-zinc-400 font-bold mt-0.5 block uppercase tracking-wider">
                        Activities Completed
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Weekly Challenge Card */}
                {profile?.weeklyChallenge && !profile.weeklyChallenge.completed && (
                  <div className="bg-white rounded-3xl border border-zinc-100 shadow-3xs p-6 space-y-4 text-left">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100">
                        Weekly Challenge
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-brand-forest leading-snug">
                        {profile.weeklyChallenge.description}
                      </p>
                      <p className="text-[9px] text-brand-green font-extrabold uppercase tracking-wider mt-1.5">
                        Reward: +{profile.weeklyChallenge.xpReward} XP
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        <span>Progress</span>
                        <span>
                          {profile.weeklyChallenge.progress}/{profile.weeklyChallenge.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-brand-green h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${Math.min((profile.weeklyChallenge.progress / profile.weeklyChallenge.target) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  );
}

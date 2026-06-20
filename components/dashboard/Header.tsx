'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  Search, BookOpen, Plus, LogOut, Settings, 
  User as UserIcon, X, Check, Award, Book, Compass, Shield
} from 'lucide-react';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onUploadClick: () => void;
}

export default function Header({ searchQuery, setSearchQuery, onUploadClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch profile on settings open to display up-to-date data
  useEffect(() => {
    if (settingsOpen) {
      api.get('/profile')
        .then((res) => setProfile(res))
        .catch(() => {});
    }
  }, [settingsOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await auth.logout();
    setUser(null);
  };

  const getInitials = (name: string) => {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <>
      <header className="border-b border-gray-100 py-4 px-8 bg-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo & Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/home" className="font-semibold text-xl tracking-tight text-brand-green flex items-center gap-2">
              <span className="w-6 h-6 bg-brand-green rounded flex items-center justify-center rotate-3">
                <span className="w-2.5 h-2.5 bg-brand-yellow rounded-sm rotate-45" />
              </span>
              Braudle
            </Link>

            <div className="h-4 w-px bg-gray-100 hidden sm:block" />

            {/* Library Page Toggle Icon */}
            <Link 
              href="/library" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                pathname === '/library' 
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/10' 
                  : 'text-gray-400 hover:text-brand-forest hover:bg-gray-50 border-transparent'
              }`}
              title="View Library"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Library</span>
            </Link>
          </div>

          {/* Desktop search */}
          {setSearchQuery && (
            <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-gray-50 border border-gray-100 rounded-full w-96 text-gray-400 focus-within:border-brand-green/30 focus-within:bg-white transition-all">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search sources..."
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none text-xs text-brand-forest focus:outline-none w-full placeholder-gray-400 font-medium"
              />
            </div>
          )}

          {/* Actions & Avatar Dropdown */}
          <div className="flex items-center gap-4">
            
            {/* Upload Button */}
            <button
              onClick={onUploadClick}
              className="flex items-center gap-1.5 rounded-full bg-brand-green py-2 px-4 text-xs font-bold text-white hover:bg-brand-green/90 transition-all cursor-pointer active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-4 h-4" /> Upload
            </button>

            {/* User Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-brand-forest/5 border border-gray-100 flex items-center justify-center cursor-pointer hover:border-brand-green/40 transition-all overflow-hidden"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-brand-forest">
                    {getInitials(user?.name || '')}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 border-b border-gray-50">
                    <p className="text-xs font-bold text-brand-forest truncate">{user?.name}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        setSettingsOpen(true);
                      }}
                      className="w-full px-4 py-2 text-xs font-medium text-gray-500 hover:text-brand-forest hover:bg-gray-50 flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      Settings & Profile
                    </button>
                  </div>

                  <div className="border-t border-gray-50 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base text-brand-forest">Settings & Profile</h3>
                <p className="text-[10px] text-gray-400">Your personalized Braudle configuration</p>
              </div>
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-50 text-gray-400 hover:text-brand-forest transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-lg border border-brand-green/20">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    getInitials(user?.name || '')
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-brand-forest">{user?.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded bg-brand-forest text-white text-[9px] uppercase tracking-wider font-semibold">
                    {user?.role || 'Student'}
                  </span>
                </div>
              </div>

              {/* Learning Metrics */}
              {profile && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 border border-gray-100 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">XP Points</span>
                    <span className="font-bold text-sm text-brand-forest">{profile.xp}</span>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Current Streak</span>
                    <span className="font-bold text-sm text-brand-forest">🔥 {profile.streak} days</span>
                  </div>
                  <div className="p-3 border border-gray-100 rounded-xl text-center">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold block mb-1">Avg Score</span>
                    <span className="font-bold text-sm text-brand-forest">🎯 {profile.averageScore}%</span>
                  </div>
                </div>
              )}

              {/* Preferences Settings */}
              <div className="space-y-4">
                <h4 className="font-bold text-xs text-brand-forest uppercase tracking-wider border-b border-gray-50 pb-1.5">
                  Tutoring Configuration
                </h4>

                <div className="space-y-3.5">
                  {/* Goal */}
                  <div className="flex items-start gap-3">
                    <Compass className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-brand-forest block">Academic Goal</span>
                      <span className="text-xs text-gray-500 block mt-0.5">
                        {profile?.goal || 'No goal set yet. Complete onboarding.'}
                      </span>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="flex items-start gap-3">
                    <Award className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-brand-forest block">Tutoring Level</span>
                      <span className="text-xs text-gray-500 block mt-0.5 capitalize">
                        {profile?.level || 'Intermediate'} {profile?.studyLevel ? `(${profile.studyLevel})` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Style */}
                  <div className="flex items-start gap-3">
                    <Book className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-brand-forest block">Preferred Learning Style</span>
                      <span className="text-xs text-gray-500 block mt-0.5 capitalize">
                        {profile?.learningStyle?.replace('_', ' ') || 'Interactive explanation'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data and Security */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-brand-forest uppercase tracking-wider border-b border-gray-50 pb-1.5">
                  Data & Protection
                </h4>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Your files are secure in cloud storage. Tutoring models verify concepts privately. No data is sold or shared.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-50 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-2.5 bg-brand-forest text-white text-xs font-bold rounded-xl hover:bg-brand-green transition-colors cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';
import { 
  Search, BookOpen, Plus, LogOut, Settings, 
  User as UserIcon, X, Check, Award, Book, Compass, Shield,
  MessageSquare
} from 'lucide-react';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onUploadClick: () => void;
}

export default function Header({ searchQuery, setSearchQuery, onUploadClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, setUser } = useStore();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <Link href="/home" className="font-semibold text-xl tracking-tight text-brand-green">
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

            <div className="h-4 w-px bg-gray-100 hidden sm:block" />

            {/* Chat with Braudle Toggle Icon */}
            <Link 
              href={pathname === '/home' && searchParams.get('chat') === 'true' ? '/home' : '/home?chat=true'} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                pathname === '/home' && searchParams.get('chat') === 'true'
                  ? 'bg-brand-green/10 text-brand-green border-brand-green/10' 
                  : 'text-gray-400 hover:text-brand-forest hover:bg-gray-50 border-transparent'
              }`}
              title="Chat with Braudle"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
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
                        router.push('/settings');
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
    </>
  );
}

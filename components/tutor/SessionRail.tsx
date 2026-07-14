'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  GitBranch,
  FileQuestion,
  Award,
  BookOpen,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Trophy,
  PanelLeftClose,
} from 'lucide-react';
import Logo from '@/components/Logo';

export type ActiveView = 'chat' | 'pdf' | 'map';
export type ActiveDrawer = 'quiz' | 'flashcards' | 'concepts' | 'summary' | null;

interface RailItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  type: 'view' | 'drawer';
  view?: ActiveView;
  drawer?: ActiveDrawer;
}

interface SessionRailProps {
  activeView: ActiveView;
  activeDrawer: ActiveDrawer;
  onViewChange: (view: ActiveView) => void;
  onDrawerChange: (drawer: ActiveDrawer) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  docTitle: string;
  isFocusMode: boolean;
  onFocusToggle: () => void;
  user?: {
    name?: string;
    email?: string;
    plan?: string;
    avatar?: string;
  } | null;
  isExamSession: boolean;
  onExamModeChange: (isExam: boolean) => void;
}

const Tooltip = ({ label, show, children }: { label: string; show: boolean; children: React.ReactNode }) => {
  if (!show) return <>{children}</>;
  return (
    <div className="relative group/tooltip flex items-center w-full justify-center">
      {children}
      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-brand-charcoal text-white text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-150 z-[100] shadow-lg font-sans select-none">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-brand-charcoal" />
      </div>
    </div>
  );
};

export default function SessionRail({
  activeView,
  activeDrawer,
  onViewChange,
  onDrawerChange,
  isMobileOpen,
  onMobileClose,
  docTitle,
  isFocusMode,
  onFocusToggle,
  user,
  isExamSession,
  onExamModeChange,
}: SessionRailProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleSidebar = () => {
    setIsTransitioning(true);
    setIsExpanded(prev => !prev);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const viewItems: RailItem[] = [
    { id: 'chat', icon: <MessageSquare className="w-[18px] h-[18px] shrink-0" />, label: 'AI Chat', type: 'view', view: 'chat' },
    { id: 'pdf', icon: <FileText className="w-[18px] h-[18px] shrink-0" />, label: 'PDF View', type: 'view', view: 'pdf' },
    { id: 'map', icon: <GitBranch className="w-[18px] h-[18px] shrink-0" />, label: 'Concept Map', type: 'view', view: 'map' },
  ];

  const drawerItems: RailItem[] = [
    { id: 'quiz', icon: <FileQuestion className="w-[18px] h-[18px] shrink-0" />, label: 'Practice Quiz', type: 'drawer', drawer: 'quiz' },
    { id: 'exam', icon: <Trophy className="w-[18px] h-[18px] shrink-0" />, label: 'Exam Prep', type: 'drawer', drawer: 'quiz' },
    { id: 'flashcards', icon: <Award className="w-[18px] h-[18px] shrink-0" />, label: 'Flashcards', type: 'drawer', drawer: 'flashcards' },
    { id: 'summary', icon: <BookOpen className="w-[18px] h-[18px] shrink-0" />, label: 'Study Summary', type: 'drawer', drawer: 'summary' },
  ];

  const handleItemClick = (item: RailItem) => {
    if (item.type === 'view' && item.view) {
      onViewChange(item.view);
    } else if (item.type === 'drawer' && item.drawer !== undefined) {
      if (item.id === 'quiz') {
        onExamModeChange(false);
        onDrawerChange(activeDrawer === 'quiz' && !isExamSession ? null : 'quiz');
      } else if (item.id === 'exam') {
        onExamModeChange(true);
        onDrawerChange(activeDrawer === 'quiz' && isExamSession ? null : 'quiz');
      } else {
        onDrawerChange(activeDrawer === item.drawer ? null : item.drawer);
      }
    }
    onMobileClose();
  };

  const viewIconClass = (item: RailItem) => {
    const isActive = activeView === item.view && activeDrawer === null;
    return `relative flex items-center transition-all duration-300 cursor-pointer active:scale-98 select-none font-sans font-semibold text-xs h-10 rounded-xl overflow-hidden w-full gap-3.5
      ${isExpanded ? 'px-3.5' : 'px-2'}
      ${isActive 
        ? 'bg-brand-green/5 text-brand-green font-bold' 
        : 'text-zinc-500 hover:text-brand-forest hover:bg-zinc-50'
      }`;
  };

  const drawerIconClass = (item: RailItem) => {
    let isActive = activeDrawer === item.drawer;
    if (item.id === 'quiz') {
      isActive = activeDrawer === 'quiz' && !isExamSession;
    } else if (item.id === 'exam') {
      isActive = activeDrawer === 'quiz' && isExamSession;
    }
    return `relative flex items-center transition-all duration-300 cursor-pointer active:scale-98 select-none font-sans font-semibold text-xs h-10 rounded-xl overflow-hidden w-full gap-3.5
      ${isExpanded ? 'px-3.5' : 'px-2'}
      ${isActive 
        ? 'bg-brand-yellow/10 text-brand-forest font-bold' 
        : 'text-zinc-500 hover:text-brand-forest hover:bg-zinc-50'
      }`;
  };

  // Get first letters of username for profile icon avatar
  const getAvatarInitials = () => {
    if (user?.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'G';
  };

  return (
    <>
      {/* ── DESKTOP RAIL ── */}
      <nav
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-zinc-100 z-30 transition-all duration-300 ease-in-out ${
          isTransitioning ? 'overflow-hidden' : 'overflow-visible'
        }`}
        style={{
          width: isFocusMode ? '0px' : isExpanded ? '240px' : '48px',
          opacity: isFocusMode ? 0 : 1,
          borderRightWidth: isFocusMode ? '0px' : '1px',
          transition: 'width 300ms ease-in-out, opacity 300ms ease-in-out, border-right-width 300ms ease-in-out',
        }}
      >
        <div className={`h-14 px-3 flex items-center border-b border-zinc-100 shrink-0 overflow-hidden ${
          isExpanded ? 'justify-between' : 'justify-center'
        }`}>
          <div className={`flex items-center select-none gap-2.5 transition-all duration-305 overflow-hidden ${
            isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
          }`}>
            <Logo size={20} className="shrink-0" />
            <span className="font-semibold text-lg text-brand-green tracking-tight font-sans whitespace-nowrap">
              Braudle
            </span>
          </div>
          
          {/* Toggle Collapse button with inspiration design icon */}
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-zinc-400 hover:text-brand-forest hover:bg-zinc-55 transition-all cursor-pointer flex items-center justify-center h-9 w-9 shrink-0 active:scale-95"
            title={isExpanded ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            <PanelLeftClose className={`w-4.5 h-4.5 transition-transform duration-300 ${isExpanded ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* Library link */}
        <div className="pt-3 px-1.5 flex flex-col items-center gap-0.5">
          <Tooltip label="Back to Library" show={!isExpanded}>
            <a
              href="/home"
              className={`flex items-center rounded-xl text-zinc-500 hover:text-brand-forest hover:bg-zinc-55 transition-all text-xs font-semibold font-sans cursor-pointer h-10 overflow-hidden w-full gap-3
                ${isExpanded ? 'px-3.5' : 'px-2'}`}
            >
              <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
              <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden inline-block ${
                isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
              }`}>
                Back to Library
              </span>
            </a>
          </Tooltip>
        </div>

        {/* View items */}
        <div className="pt-3 px-1.5 flex flex-col gap-1">
          <span className={`text-[9px] font-black uppercase tracking-widest text-zinc-400 px-4 font-sans transition-all duration-300 whitespace-nowrap overflow-hidden inline-block ${
            isExpanded ? 'opacity-100 max-h-8 py-1' : 'opacity-0 max-h-0 py-0 pointer-events-none'
          }`}>
            Workspace
          </span>
          {viewItems.map((item) => {
            const isActive = activeView === item.view && activeDrawer === null;
            return (
              <Tooltip key={item.id} label={item.label} show={!isExpanded}>
                <button onClick={() => handleItemClick(item)} className={viewIconClass(item)}>
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-green" />
                  )}
                  {item.icon}
                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden inline-block ${
                    isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>

        {/* Drawer items */}
        <div className="pt-5 px-1.5 flex flex-col gap-1">
          <span className={`text-[9px] font-black uppercase tracking-widest text-zinc-400 px-4 font-sans transition-all duration-300 whitespace-nowrap overflow-hidden inline-block ${
            isExpanded ? 'opacity-100 max-h-8 py-1' : 'opacity-0 max-h-0 py-0 pointer-events-none'
          }`}>
            Study Tools
          </span>
          {drawerItems.map((item) => {
            let isActive = activeDrawer === item.drawer;
            if (item.id === 'quiz') {
              isActive = activeDrawer === 'quiz' && !isExamSession;
            } else if (item.id === 'exam') {
              isActive = activeDrawer === 'quiz' && isExamSession;
            }
            return (
              <Tooltip key={item.id} label={item.label} show={!isExpanded}>
                <button onClick={() => handleItemClick(item)} className={drawerIconClass(item)}>
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-yellow" />
                  )}
                  {item.icon}
                  <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden inline-block ${
                    isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </Tooltip>
            );
          })}
        </div>

        <div className="flex-1" />

        {/* Profile at bottom */}
        <div className="p-2 border-t border-zinc-100 mt-auto shrink-0 flex flex-col gap-1.5">
          {/* User Card */}
          <Tooltip label={user?.name || user?.email || 'Student Profile'} show={!isExpanded}>
            <div className={`flex items-center select-none overflow-hidden transition-all duration-300 w-full ${
              isExpanded ? 'gap-2.5 p-2 bg-white rounded-xl border border-zinc-100' : 'gap-0 p-0.5 bg-transparent border-transparent'
            }`}>
              <div className="w-8 h-8 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-xs font-sans shrink-0 uppercase overflow-hidden border border-brand-green/20">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  getAvatarInitials()
                )}
              </div>
              <div className={`flex-1 min-w-0 transition-all duration-300 whitespace-nowrap overflow-hidden ${
                isExpanded ? 'opacity-100 max-w-[150px]' : 'opacity-0 max-w-0 pointer-events-none'
              }`}>
                <p className="text-xs font-bold text-brand-forest truncate font-sans">
                  {user?.name || user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
          </Tooltip>
        </div>
      </nav>

      {/* ── MOBILE SLIDE-IN SIDEBAR ── */}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden flex flex-col w-72 bg-white border-r border-zinc-100 shadow-2xl transition-transform duration-300 ease-in-out transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <Logo size={20} className="shrink-0" />
            <span className="text-brand-forest font-black text-sm tracking-tight font-sans">Braudle</span>
          </div>
          <button
            onClick={onMobileClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-zinc-400 hover:text-brand-forest hover:bg-zinc-50 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Doc title */}
        <div className="px-4 py-3.5 border-b border-zinc-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-brand-green font-sans">Study Space</p>
          <p className="text-sm font-extrabold text-brand-forest mt-1 font-sans leading-snug line-clamp-2">{docTitle}</p>
        </div>

        {/* Back to Library Link in Mobile View */}
        <div className="px-3 pt-3">
          <a
            href="/home"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 hover:text-brand-forest hover:bg-zinc-55 transition-all text-[13px] font-semibold font-sans cursor-pointer"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
            <span>Back to Library</span>
          </a>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* Workspace views */}
          <div className="px-3 mb-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-4 py-1 font-sans">Workspace</p>
            <div className="space-y-0.5">
              {viewItems.map((item) => {
                const isActive = activeView === item.view && activeDrawer === null;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-150 cursor-pointer select-none text-left font-sans ${
                      isActive ? 'bg-brand-green/10 text-brand-green font-bold' : 'text-zinc-500 hover:text-brand-forest hover:bg-zinc-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-green" />
                    )}
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mx-4 my-3 border-t border-zinc-100" />

          {/* Study tools */}
          <div className="px-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-4 py-1 font-sans">Study Tools</p>
            <div className="space-y-0.5">
              {drawerItems.map((item) => {
                let isActive = activeDrawer === item.drawer;
                if (item.id === 'quiz') {
                  isActive = activeDrawer === 'quiz' && !isExamSession;
                } else if (item.id === 'exam') {
                  isActive = activeDrawer === 'quiz' && isExamSession;
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-150 cursor-pointer select-none text-left font-sans ${
                      isActive ? 'bg-brand-yellow/10 text-brand-forest font-bold' : 'text-zinc-500 hover:text-brand-forest hover:bg-zinc-50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-yellow" />
                    )}
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

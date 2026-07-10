'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import Logo from '@/components/Logo';
import {
  Brain, Activity, ShieldAlert, ListFilter, CheckCircle,
  RefreshCw, LogOut, ShieldCheck, Users,
  FolderOpen, AlertTriangle, ChevronRight, X,
  Lock, Mail, Clock, Check, Layers
} from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  plan: string;
  lastUploadDate?: string;
  uploadCount?: { pdf: number; image: number };
  dailyGenerationsCount?: { flashcards: number; practice: number; exam: number };
  createdAt: string;
}

interface PlatformStats {
  totalDocuments: number;
  pdfCount: number;
  imageCount: number;
  totalQuizzes: number;
  totalSessions: number;
}

interface SystemStats {
  mongodb: string;
  redis: string;
}

interface ErrorLogItem {
  _id: string;
  errorId: string;
  message: string;
  stack?: string;
  statusCode: number;
  userId?: { name: string; email: string };
  source: 'api' | 'worker';
  route?: string;
  method?: string;
  body?: any;
  ip?: string;
  userAgent?: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export default function LighthouseDashboard() {
  const router = useRouter();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Data State
  const [stats, setStats] = useState<{
    users: { total: number; free: number; plus: number; pro: number; list: UserItem[] };
    platform: PlatformStats;
    system: SystemStats;
  } | null>(null);

  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([]);
  const [errorTotal, setErrorTotal] = useState(0);
  const [errorFilter, setErrorFilter] = useState<'all' | 'active' | 'resolved'>('active');
  const [errorSource, setErrorSource] = useState<'all' | 'api' | 'worker'>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | 'free' | 'plus' | 'pro'>('all');
  const [errorPage, setErrorPage] = useState(1);
  const [errorPagesCount, setErrorPagesCount] = useState(1);

  // Detail Modal / Drawer
  const [selectedError, setSelectedError] = useState<ErrorLogItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication on load
  useEffect(() => {
    fetchData();
  }, [errorFilter, errorSource, errorPage]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // Fetch Stats
      const statsRes = await api.get<any>('/admin/lighthouse/stats');
      setStats(statsRes);
      setIsAuthenticated(true);

      // Fetch Errors
      const isResolved = errorFilter === 'all' ? undefined : errorFilter === 'resolved' ? 'true' : 'false';
      const source = errorSource === 'all' ? undefined : errorSource;
      
      const queryParams = new URLSearchParams();
      if (isResolved !== undefined) queryParams.append('isResolved', isResolved);
      if (source !== undefined) queryParams.append('source', source);
      queryParams.append('page', String(errorPage));
      queryParams.append('limit', '15');

      const errorsRes = await api.get<any>(`/admin/lighthouse/errors?${queryParams.toString()}`);
      setErrorLogs(errorsRes.logs);
      setErrorTotal(errorsRes.total);
      setErrorPagesCount(errorsRes.pages);
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setIsAuthenticated(false);
      } else {
        console.error('Lighthouse fetch failed:', err);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      await api.post('/admin/lighthouse/login', { email, password });
      setIsAuthenticated(true);
      fetchData();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/admin/lighthouse/logout');
      setIsAuthenticated(false);
      setStats(null);
      setErrorLogs([]);
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      setIsAuthenticated(false);
      setStats(null);
      setErrorLogs([]);
      router.push('/');
    }
  };

  const handleResolveError = async (logId: string) => {
    try {
      await api.post(`/admin/lighthouse/errors/${logId}/resolve`);
      
      // Update local state
      setErrorLogs(prev => prev.map(log => log._id === logId ? { ...log, isResolved: true, resolvedAt: new Date().toISOString() } : log));
      if (selectedError?._id === logId) {
        setSelectedError(prev => prev ? { ...prev, isResolved: true, resolvedAt: new Date().toISOString() } : null);
      }
      
      // Auto refresh list after action
      setTimeout(fetchData, 400);
    } catch (err) {
      console.error('Failed to resolve log:', err);
    }
  };

  // Filtered Users
  const filteredUsers = stats?.users.list.filter(u => {
    if (userPlanFilter === 'all') return true;
    if (userPlanFilter === 'free') return u.plan === 'free' || !u.plan;
    return u.plan === userPlanFilter;
  }) || [];

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 text-brand-forest flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 text-brand-green animate-pulse" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-450">Contacting Lighthouse...</p>
        </div>
      </div>
    );
  }

  // --- LOGIN PANEL VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 text-brand-forest flex items-center justify-center font-sans relative overflow-hidden px-4">
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-green/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-gray-150 rounded-[32px] p-8 shadow-xl relative z-10">
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/5 border border-brand-green/10 flex items-center justify-center shadow-inner">
              <Brain className="w-6 h-6 text-brand-green" />
            </div>
            <h1 className="text-xl font-extrabold text-brand-forest tracking-tight flex items-center gap-1.5 justify-center">
              <span>BRAUDLE</span>
              <span className="text-[10px] font-black tracking-widest bg-brand-lime text-brand-green border border-brand-green/15 px-2 py-0.5 rounded-md">LIGHTHOUSE</span>
            </h1>
            <p className="text-xs text-gray-500 font-medium">Administrative command panel & log analyzer.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Admin Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="abrahamoluwaniyi50@gmail.com"
                className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 text-sm font-semibold text-brand-forest focus:outline-none focus:border-brand-green focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-450 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>Secret Key</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="•••••••••••••"
                className="w-full p-3.5 border border-gray-200 rounded-2xl bg-gray-50 text-sm font-semibold text-brand-forest focus:outline-none focus:border-brand-green focus:bg-white transition-all placeholder:text-gray-400"
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-650 font-semibold bg-rose-50 border border-rose-100 p-3 rounded-xl">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-4 bg-brand-green text-white font-extrabold text-sm rounded-2xl shadow-sm transition-all active:scale-[0.98] hover:bg-brand-green/90 disabled:opacity-50 cursor-pointer text-center mt-6 flex items-center justify-center gap-1.5"
            >
              {loggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking command deck...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED DASHBOARD VIEW ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 font-sans flex flex-col min-w-0 antialiased pb-20">
      
      {/* Navbar */}
      <header className="border-b border-gray-150/80 bg-white sticky top-0 z-40 w-full px-8 py-4 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/home" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight text-brand-green">
            <Logo size={26} className="shrink-0" />
            <span className="font-extrabold text-brand-forest uppercase tracking-wider text-sm flex items-center gap-1.5">
              <span>Braudle</span>
              <span className="text-[9px] font-black text-brand-green bg-brand-lime px-2 py-0.5 rounded-md uppercase tracking-wider border border-brand-green/10">
                Lighthouse
              </span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="p-2 px-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-500 hover:text-brand-forest transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs active:scale-[0.98]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 px-3 border border-rose-100 rounded-xl bg-rose-50 hover:bg-rose-100/50 text-rose-600 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Admin</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-8 pt-8 space-y-8 flex-1">
        
        {/* 1. General Aggregates Metrics Row */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* User overview card */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between hover:border-brand-green/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Audience</span>
              <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-brand-green" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-brand-forest">{stats?.users.total ?? 0}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold text-gray-400">
                <span>Free: {stats?.users.free ?? 0}</span>
                <span>·</span>
                <span className="text-brand-green">Paid: {(stats?.users.plus ?? 0) + (stats?.users.pro ?? 0)}</span>
              </div>
            </div>
          </div>

          {/* Plus users card */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between hover:border-brand-green/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Plus Plan Users</span>
              <div className="w-8 h-8 rounded-xl bg-brand-green/5 border border-brand-green/10 flex items-center justify-center text-brand-green">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-brand-forest">{stats?.users.plus ?? 0}</h2>
              <p className="text-[11px] font-semibold text-gray-450 mt-1.5">
                Active Plus Subscribers
              </p>
            </div>
          </div>

          {/* Pro users card */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between hover:border-brand-green/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Pro Plan Users</span>
              <div className="w-8 h-8 rounded-xl bg-brand-forest/5 border border-brand-forest/10 flex items-center justify-center text-brand-forest">
                <Layers className="w-4 h-4 text-brand-lime" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-brand-forest">{stats?.users.pro ?? 0}</h2>
              <p className="text-[11px] font-semibold text-gray-450 mt-1.5">
                Elite Enterprise Subscribers
              </p>
            </div>
          </div>

          {/* Documents card */}
          <div className="bg-white border border-gray-100 p-5 rounded-3xl space-y-4 shadow-xs flex flex-col justify-between hover:border-brand-green/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Source Database</span>
              <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-brand-green" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-brand-forest">{stats?.platform.totalDocuments ?? 0}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-[11px] font-semibold text-gray-400">
                <span>PDFs: {stats?.platform.pdfCount ?? 0}</span>
                <span>·</span>
                <span>Images: {stats?.platform.imageCount ?? 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Platform Activities and System Health */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Health widget */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-forest">System Gateway Connections</h3>
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.system.mongodb === 'connected' ? 'bg-brand-green' : 'bg-rose-500 animate-pulse'}`} />
                  <span className="text-xs font-bold text-brand-forest">MongoDB database</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stats?.system.mongodb === 'connected' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-rose-50 border-rose-250 text-rose-600'}`}>
                  {stats?.system.mongodb || 'Checking'}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats?.system.redis === 'connected' ? 'bg-brand-green' : 'bg-rose-500 animate-pulse'}`} />
                  <span className="text-xs font-bold text-brand-forest">Redis cache store</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${stats?.system.redis === 'connected' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-rose-50 border-rose-250 text-rose-600'}`}>
                  {stats?.system.redis || 'Checking'}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2 text-[11px] text-gray-400 font-semibold leading-relaxed">
              <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-green/30" /> Background jobs running concurrently: 6</p>
              <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-green/30" /> Dynamic PDFVision transcription: OCR Fallback active</p>
              <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-green/30" /> Active ingestion queue: Processing normal</p>
            </div>
          </div>

          {/* Activity cards */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 lg:col-span-2 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-forest">Platform Generation Traffic</h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Practice Quizzes Taken</span>
                  <span className="text-3xl font-extrabold text-brand-forest mt-2">{stats?.platform.totalQuizzes ?? 0}</span>
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 flex flex-col justify-between">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Study Sessions Started</span>
                  <span className="text-3xl font-extrabold text-brand-forest mt-2">{stats?.platform.totalSessions ?? 0}</span>
                </div>
              </div>
            </div>
            
            <p className="text-[11px] text-gray-400 font-medium">
              * Statistics are accumulated globally across all user profile generations.
            </p>
          </div>
        </section>

        {/* 3. Error House - Central Logging System */}
        <section className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden flex flex-col min-w-0">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-brand-forest uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-550" />
                <span>Error House Log Central</span>
              </h2>
              <p className="text-xs text-gray-450 font-medium">Track, analyze, and resolve server and queue worker errors.</p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-0.5 text-xs font-bold text-gray-500">
                <button
                  onClick={() => { setErrorFilter('active'); setErrorPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${errorFilter === 'active' ? 'bg-rose-50 text-rose-600 border border-rose-100/50' : 'border border-transparent hover:text-brand-forest'}`}
                >
                  Active ({errorFilter === 'active' ? errorTotal : '...'})
                </button>
                <button
                  onClick={() => { setErrorFilter('resolved'); setErrorPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${errorFilter === 'resolved' ? 'bg-brand-green/10 text-brand-green border border-brand-green/15' : 'border border-transparent hover:text-brand-forest'}`}
                >
                  Resolved ({errorFilter === 'resolved' ? errorTotal : '...'})
                </button>
                <button
                  onClick={() => { setErrorFilter('all'); setErrorPage(1); }}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${errorFilter === 'all' ? 'bg-brand-forest text-white' : 'border border-transparent hover:text-brand-forest'}`}
                >
                  All Logs
                </button>
              </div>

              {/* Source selection */}
              <select
                value={errorSource}
                onChange={e => { setErrorSource(e.target.value as any); setErrorPage(1); }}
                className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold text-gray-650 focus:outline-none cursor-pointer hover:bg-gray-100/50"
              >
                <option value="all">All Sources</option>
                <option value="api">API Errors</option>
                <option value="worker">Worker Errors</option>
              </select>
            </div>
          </div>

          {/* Logs List Table */}
          <div className="overflow-x-auto min-w-0 w-full">
            {errorLogs.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center text-gray-400">
                <CheckCircle className="w-8 h-8 text-brand-green/40" />
                <p className="text-sm font-extrabold text-brand-forest">Zero active errors detected!</p>
                <p className="text-xs text-gray-400 max-w-[280px]">Your platform is running smoothly with no unresolved runtime crashes.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs font-medium min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">ID & Status</th>
                    <th className="py-4 px-6">Source</th>
                    <th className="py-4 px-6">Error Message</th>
                    <th className="py-4 px-6">Route / Context</th>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  {errorLogs.map((log) => (
                    <tr
                      key={log._id}
                      onClick={() => setSelectedError(log)}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-gray-400">{log.errorId}</span>
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${log.isResolved ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                            {log.isResolved ? 'Resolved' : 'Active'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${log.source === 'worker' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-sky-50 border-sky-100 text-sky-600'}`}>
                          {log.source === 'worker' ? 'worker' : 'api'}
                        </span>
                      </td>
                      <td className="py-4 px-6 max-w-xs">
                        <p className="font-bold text-brand-forest truncate group-hover:text-brand-green transition-colors">{log.message}</p>
                        {log.userId && (
                          <span className="text-[10px] text-gray-400 mt-0.5 block truncate">User: {log.userId.email}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {log.route ? (
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                            {log.method && <span className="font-extrabold text-gray-400">{log.method}</span>}
                            <span className="truncate max-w-[150px]">{log.route}</span>
                          </div>
                        ) : (
                          <span className="text-gray-300 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(log.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedError(log)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold text-gray-500 hover:text-brand-forest hover:border-gray-300 transition-all cursor-pointer bg-white"
                          >
                            Details
                          </button>
                          {!log.isResolved && (
                            <button
                              onClick={() => handleResolveError(log._id)}
                              className="px-3 py-1.5 bg-brand-green hover:bg-brand-green/90 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer active:scale-95 shadow-sm"
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar */}
          {errorPagesCount > 1 && (
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30 text-xs font-bold text-gray-405">
              <span>Showing Page {errorPage} of {errorPagesCount}</span>
              <div className="flex gap-2">
                <button
                  disabled={errorPage <= 1}
                  onClick={() => setErrorPage(prev => prev - 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-205 hover:text-brand-forest hover:border-gray-300 transition-all disabled:opacity-30 cursor-pointer bg-white"
                >
                  Previous
                </button>
                <button
                  disabled={errorPage >= errorPagesCount}
                  onClick={() => setErrorPage(prev => prev + 1)}
                  className="px-3 py-1.5 rounded-lg border border-gray-205 hover:text-brand-forest hover:border-gray-300 transition-all disabled:opacity-30 cursor-pointer bg-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4. Active Users List Grid & Filters */}
        <section className="bg-white border border-gray-100 rounded-3xl shadow-xs overflow-hidden flex flex-col min-w-0">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-brand-forest uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-green" />
                <span>Audience Registry List</span>
              </h2>
              <p className="text-xs text-gray-450 font-medium">Browse and filter active registered student profiles.</p>
            </div>

            {/* Plan Filter dropdown */}
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-450" />
              <select
                value={userPlanFilter}
                onChange={e => setUserPlanFilter(e.target.value as any)}
                className="p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-xs font-bold text-gray-650 focus:outline-none cursor-pointer hover:bg-gray-100/50"
              >
                <option value="all">All Plans</option>
                <option value="free">Free Tier</option>
                <option value="plus">Plus Plan</option>
                <option value="pro">Pro Plan</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto min-w-0 w-full">
            {filteredUsers.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-center text-gray-400">
                <Users className="w-8 h-8 text-gray-200 animate-pulse" />
                <p className="text-sm font-extrabold text-brand-forest">No users match filter criteria</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left text-xs font-medium min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-150 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Plan Status</th>
                    <th className="py-4 px-6">Upload Tracker</th>
                    <th className="py-4 px-6">Tutor Generations</th>
                    <th className="py-4 px-6">Created On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-650">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-bold text-brand-forest">{u.name}</p>
                          <span className="text-[10px] text-gray-450 mt-0.5 block">{u.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded border ${
                          u.plan === 'pro' ? 'bg-brand-forest text-brand-lime border-brand-forest/20' :
                          u.plan === 'plus' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {u.plan || 'free'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-450">
                        <span>PDFs: {u.uploadCount?.pdf ?? 0}</span>
                        <span className="mx-1.5 text-gray-200">|</span>
                        <span>Images: {u.uploadCount?.image ?? 0}</span>
                      </td>
                      <td className="py-4 px-6 font-semibold text-gray-450">
                        <span>Cards: {u.dailyGenerationsCount?.flashcards ?? 0}</span>
                        <span className="mx-1.5 text-gray-200">|</span>
                        <span>Quizzes: {u.dailyGenerationsCount?.practice ?? 0}</span>
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* 5. Error Details Drawer Overlay */}
      {selectedError && (
        <div className="fixed inset-0 z-50 flex justify-end font-sans">
          {/* Backdrop blur */}
          <div
            className="absolute inset-0 bg-brand-forest/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedError(null)}
          />

          {/* Drawer content panel */}
          <div className="relative w-full max-w-2xl bg-white border-l border-gray-100 h-full flex flex-col shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-right duration-250 text-left">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-400">{selectedError.errorId}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${selectedError.isResolved ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                    {selectedError.isResolved ? 'Resolved' : 'Active'}
                  </span>
                </div>
                <h2 className="text-sm font-extrabold text-brand-forest uppercase tracking-wider truncate max-w-md">
                  {selectedError.message}
                </h2>
              </div>
              <button
                onClick={() => setSelectedError(null)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-brand-forest transition-all cursor-pointer bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Log Details body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Log Source</span>
                  <span className="text-xs font-bold text-brand-forest mt-1.5 block uppercase tracking-wide">
                    {selectedError.source}
                  </span>
                </div>
                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">HTTP status</span>
                  <span className="text-xs font-bold text-brand-forest mt-1.5 block">
                    {selectedError.statusCode}
                  </span>
                </div>
                {selectedError.userId && (
                  <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 col-span-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Triggering User</span>
                    <div className="text-xs font-bold text-brand-forest mt-1.5 space-y-0.5">
                      <p>{selectedError.userId.name}</p>
                      <p className="text-[10px] text-gray-450 font-medium">{selectedError.userId.email}</p>
                    </div>
                  </div>
                )}
                {selectedError.route && (
                  <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50 col-span-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Route Context</span>
                    <div className="font-mono text-[10px] text-brand-forest mt-1.5 flex items-center gap-1.5">
                      {selectedError.method && <span className="font-black text-gray-450">{selectedError.method}</span>}
                      <span>{selectedError.route}</span>
                    </div>
                  </div>
                )}
                {selectedError.ip && (
                  <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Remote IP Address</span>
                    <span className="text-xs font-mono text-gray-500 mt-1.5 block">
                      {selectedError.ip}
                    </span>
                  </div>
                )}
                <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Occurred At</span>
                  <span className="text-xs font-bold text-brand-forest mt-1.5 block">
                    {new Date(selectedError.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Request Payload / data */}
              {selectedError.body && Object.keys(selectedError.body).length > 0 && (
                <div className="space-y-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Request Payload / Job Data</span>
                  <pre className="p-4 bg-gray-50 border border-gray-100 rounded-2xl font-mono text-[10px] text-brand-forest overflow-x-auto whitespace-pre leading-relaxed">
                    {JSON.stringify(selectedError.body, null, 2)}
                  </pre>
                </div>
              )}

              {/* Stack trace */}
              {selectedError.stack && (
                <div className="space-y-2">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Error Stack Trace</span>
                  <pre className="p-4 bg-rose-50/30 border border-rose-100/55 rounded-2xl font-mono text-[10px] text-rose-600/90 overflow-x-auto whitespace-pre leading-relaxed select-text">
                    {selectedError.stack}
                  </pre>
                </div>
              )}
            </div>

            {/* Bottom Actions footer */}
            {!selectedError.isResolved && (
              <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedError(null)}
                  className="px-4 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-500 hover:text-brand-forest hover:bg-gray-50 transition-all cursor-pointer active:scale-95 bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleResolveError(selectedError._id)}
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer active:scale-95 shadow-sm flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark as Resolved</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

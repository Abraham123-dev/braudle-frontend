'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { auth } from '@/lib/auth';
import { useStore } from '@/lib/store';
import { LogOut } from 'lucide-react';

export default function DashboardPage() {
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);

  const handleLogout = async () => {
    await auth.logout();
    setUser(null);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-brand-charcoal text-white font-sans flex flex-col">
        {/* Navbar */}
        <header className="border-b border-white/5 py-4 px-6 bg-white/5 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-black text-sm">
                B
              </span>
              <span className="font-bold text-white tracking-wider">BRAUDLE</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-400 font-medium">
                Hi, {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/5 transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-16 h-16 bg-brand-green/20 border border-brand-green/30 rounded-3xl flex items-center justify-center">
            <span className="text-brand-lime font-black text-2xl">B</span>
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-white">Welcome to Braudle Dashboard</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Authentication is verified. Mock data has been cleaned up. The dashboard is ready to be redesigned for backend API integration.
            </p>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}


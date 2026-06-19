/**
 * BRAUDLE Authentication Helpers
 */

import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin' | 'teacher';
  onboardingComplete?: boolean;
  needsNameUpdate?: boolean;
}

// Client-side authentication persistence helper
export const auth = {
  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('braudle_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('braudle_user', JSON.stringify(user));
  },

  clearCurrentUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('braudle_user');
  },

  async logout(): Promise<void> {
    try {
      // Clear HTTP-only session cookies on backend
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Failed to log out from backend:', err);
    }
    
    // Clear client-side user cache
    this.clearCurrentUser();
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};


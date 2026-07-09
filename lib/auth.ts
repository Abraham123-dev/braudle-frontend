/**
 * BRAUDLE Authentication Helpers
 */



export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin' | 'teacher';
  onboardingComplete?: boolean;
  needsNameUpdate?: boolean;
  authProvider?: 'google' | 'email';
  plan?: 'free' | 'plus' | 'pro';
  xp?: number;
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
    console.log('[AUTH] clearCurrentUser called');
    localStorage.removeItem('braudle_user');
  },

  async logout(): Promise<void> {
    console.log('[AUTH] logout called, stack:', new Error().stack);
    // Always clear client-side state first — never block on backend
    this.clearCurrentUser();

    // Fire-and-forget: tell backend to revoke refresh token + clear httpOnly cookies.
    // We don't await this — the user should be redirected immediately.
    if (typeof window !== 'undefined') {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch(() => {
        // Swallow — logout must never fail from the user's perspective
      });

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
};


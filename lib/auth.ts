/**
 * BRAUDLE Authentication Helpers
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'admin' | 'teacher';
}

// Client-side authentication persistence helper
export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    // In strict environments, JWT might be httpOnly and managed entirely by browser cookies.
    // As a fallback for SPA, we can read/write local storage or direct document.cookie
    return localStorage.getItem('braudle_token');
  },

  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('braudle_token', token);
  },

  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('braudle_token');
    localStorage.removeItem('braudle_user');
  },

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

  logout(): void {
    this.clearToken();
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

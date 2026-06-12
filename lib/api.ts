/**
 * BRAUDLE API Client
 * Central client for interacting with the Express backend APIs.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  data: T;
  status: number | string;
  message?: string;
}

// Helper to handle refresh logic
let isRefreshing = false;
let refreshSubscribers: ((token: boolean) => void)[] = [];

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

async function fetchWithIntercept(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure credentials are sent to pass the httpOnly JWT cookie
  options.credentials = 'include';
  
  let res = await fetch(url, options);

  // If 401, try to refresh
  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed(true);
          // Retry original request
          res = await fetch(url, options);
        } else {
          isRefreshing = false;
          onRefreshed(false);
          // Clear local auth state
          if (typeof window !== 'undefined') {
            localStorage.removeItem('braudle_token');
            localStorage.removeItem('braudle_user');
            window.location.href = '/login';
          }
        }
      } catch (err) {
        isRefreshing = false;
        onRefreshed(false);
      }
    } else {
      // Wait for refresh to complete, then retry
      const success = await new Promise<boolean>((resolve) => {
        addRefreshSubscriber(resolve);
      });
      if (success) {
        res = await fetch(url, options);
      }
    }
  }

  if (!res.ok) {
    // Attempt to parse json error
    let errorMessage = res.statusText;
    try {
      const errData = await res.json();
      if (errData.message) {
        errorMessage = errData.message;
      }
    } catch (e) {
      // Ignore JSON parse error on error response
    }
    throw new Error(errorMessage);
  }

  return res;
}

// Global fetch-based API wrapper
export const api = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      ...options,
      headers,
    });
    return res.json() as Promise<T>;
  },

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const headers = new Headers(options?.headers);
    
    if (!isFormData && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      ...options,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    return res.json() as Promise<T>;
  },

  async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      ...options,
      headers,
      body: JSON.stringify(body),
    });
    return res.json() as Promise<T>;
  },

  async patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      ...options,
      headers,
      body: JSON.stringify(body),
    });
    return res.json() as Promise<T>;
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      ...options,
      headers,
    });
    return res.json() as Promise<T>;
  },
};

/**
 * SSE (Server-Sent Events) Stream connection helper using fetch for POST
 */
export async function postStream(
  endpoint: string,
  body: any,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const res = await fetchWithIntercept(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(body)
    });

    if (!res.body) {
      throw new Error('No response body stream available');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              onError(new Error(parsed.error));
              return;
            }
            if (parsed.token) {
              onToken(parsed.token);
            }
          } catch (e) {
            // Ignore parse errors for partial/malformed data chunks
          }
        }
      }
    }
    onDone();
  } catch (err) {
    onError(err);
  }
}

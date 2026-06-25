/**
 * BRAUDLE API Client
 * Central client for interacting with the Express backend APIs.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

/**
 * Raw fetch wrapper that automatically handles 401 Unauthorized status
 * by performing a silent token refresh and retrying the request.
 */
export async function fetchWithRefresh(url: string, options?: RequestInit): Promise<Response> {
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include', // Crucial for httpOnly cookies
  };

  const response = await fetch(url, requestOptions);

  if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/logout')) {
    const retryPromise = new Promise<Response>((resolve, reject) => {
      subscribeTokenRefresh((success) => {
        if (success) {
          fetch(url, requestOptions)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('Unauthorized'));
        }
      });
    });

    if (!isRefreshing) {
      isRefreshing = true;
      (async () => {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            isRefreshing = false;
            onRefreshed(true);
          } else {
            isRefreshing = false;
            onRefreshed(false);
            if (typeof window !== 'undefined') {
              const { auth } = await import('./auth');
              auth.logout();
            }
          }
        } catch (err) {
          isRefreshing = false;
          onRefreshed(false);
          if (typeof window !== 'undefined') {
            const { auth } = await import('./auth');
            auth.logout();
          }
        }
      })();
    }

    return retryPromise;
  }

  return response;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetchWithRefresh(url, requestOptions);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {}
    
    const message = errorData?.message || response.statusText;
    const error: any = new Error(message);
    error.status = response.status;
    error.code = errorData?.code;
    error.responseStatus = errorData?.status || 'error';
    throw error;
  }

  return response.json() as Promise<T>;
}

// Global fetch-based API wrapper
export const api = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { method: 'GET', ...options });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
  },

  put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    });
  },

  patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE', ...options });
  },
};

/**
 * SSE (Server-Sent Events) Stream connection helper
 */
export function connectToSSEStream(
  endpoint: string,
  onToken: (token: string) => void,
  onDone: () => void,
  onError: (err: any) => void
) {
  try {
    const eventSource = new EventSource(`${API_BASE_URL}${endpoint}`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        onDone();
        return;
      }
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.token) {
          onToken(parsed.token);
        }
      } catch (e) {
        onError(e);
      }
    };

    eventSource.onerror = (err) => {
      eventSource.close();
      onError(err);
    };

    return () => {
      eventSource.close();
    };
  } catch (err) {
    onError(err);
    return () => {};
  }
}


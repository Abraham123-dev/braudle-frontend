import { useStore } from './store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

let isRefreshing = false;
let refreshSubscribers: ((success: boolean, error?: any) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean, error?: any) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean, error?: any) {
  refreshSubscribers.forEach((cb) => cb(success, error));
  refreshSubscribers = [];
}

/**
 * Pings backend health endpoint to check connection.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET', cache: 'no-store' });
    if (res.ok) {
      useStore.getState().setConnectionError(false);
      return true;
    }
  } catch {}
  return false;
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

  if (response.status === 401 && !url.includes('/auth/refresh') && !url.includes('/auth/logout') && !url.includes('/admin/lighthouse')) {
    const retryPromise = new Promise<Response>((resolve, reject) => {
      subscribeTokenRefresh((success, error) => {
        if (success) {
          fetch(url, requestOptions)
            .then(resolve)
            .catch(reject);
        } else {
          reject(error || new Error('Unauthorized'));
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
            
            const error = new Error('Unauthorized');
            (error as any).status = refreshRes.status;
            onRefreshed(false, error);

            // Only log out on real authorization issues (401 or 403)
            if (refreshRes.status === 401 || refreshRes.status === 403) {
              console.log('[API] Silent refresh returned status:', refreshRes.status, '. Logging out.');
              if (typeof window !== 'undefined') {
                const { auth } = await import('./auth');
                auth.logout();
              }
            }
          }
        } catch (err) {
          isRefreshing = false;
          console.error('[API] Silent refresh threw network/fetch error:', err);
          // Propagate the network error instead of treating it as Unauthorized
          onRefreshed(false, err);
        }
      })();
    }

    return retryPromise;
  }

  return response;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetchWithRefresh(url, requestOptions);
    
    // Clear connection errors upon any successful response
    useStore.getState().setConnectionError(false);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {}
      
      const rawMessage = errorData?.message || response.statusText;
      const errorId = errorData?.errorId || null;
      
      // Standardize system error messages for 5xx errors
      let clientMessage = rawMessage;
      if (response.status >= 500) {
        clientMessage = 'An unexpected error occurred on our end. Please try again later.';
      }
      
      const error: any = new Error(clientMessage);
      error.status = response.status;
      error.code = errorData?.code;
      error.responseStatus = errorData?.status || 'error';
      error.errorId = errorId;
      error.rawMessage = rawMessage;
      throw error;
    }

    return response.json() as Promise<T>;
  } catch (error: any) {
    // If it is a connection/network issue (no HTTP status code)
    if (!error.status) {
      useStore.getState().setConnectionError(true);
      error.message = 'Unable to connect to the server. Please check your internet connection and try again.';
      error.isNetworkError = true;
    }
    throw error;
  }
}

// Global fetch-based API wrapper
export const api = {
  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, { method: 'GET', ...options });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
      ...options,
    });
  },

  put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
      ...options,
    });
  },

  patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return request<T>(endpoint, {
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
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


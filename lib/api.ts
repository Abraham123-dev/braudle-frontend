/**
 * BRAUDLE API Client
 * Central client for interacting with the Express backend APIs.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

// Global fetch-based API wrapper
export const api = {
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  },

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  },

  async put<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  },

  async patch<T>(endpoint: string, body: any, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(body),
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
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

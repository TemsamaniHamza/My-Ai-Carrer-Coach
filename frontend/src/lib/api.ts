import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Access token lives only in memory (never localStorage) — the refresh token
// is the persistent credential, held in an httpOnly cookie the browser
// manages on its own. Losing this on a hard refresh is expected; AuthContext
// silently calls /auth/refresh on app load to restore it from the cookie.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send/receive the httpOnly refresh cookie cross-origin
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Bare instance (no interceptors) so the refresh call itself can't recurse
// into this same 401-handling logic.
const refreshClient = axios.create({ baseURL: API_URL, withCredentials: true });

let refreshPromise: Promise<string | null> | null = null;

/**
 * Calls /auth/refresh, deduped against any concurrent caller (the response
 * interceptor below, AND AuthContext's initial session restore both call
 * this — sharing one in-flight promise is what prevents two near-simultaneous
 * refreshes from racing each other and revoking a token the other one needed).
 */
export async function refreshAccessToken(): Promise<string | null> {
  // Multiple requests can 401 at once (e.g. a page firing several calls in
  // parallel) — dedupe so we only hit /auth/refresh once, and every caller
  // waits on the same in-flight attempt.
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<{ accessToken: string }>('/auth/refresh')
      .then((res) => {
        const token = res.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retried &&
      !isAuthRoute
    ) {
      originalRequest._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);

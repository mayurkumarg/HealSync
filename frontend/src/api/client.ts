import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'healsync-token'

/** Fired whenever a request comes back 401 and the stored token gets cleared, so AuthContext
 * (which owns the in-memory `user` state) can react — without this, a token going stale mid-
 * session leaves the app rendering authenticated pages with no token attached to any request,
 * cascading into a wall of "You are not logged in" errors on every fetch instead of a clean
 * bounce to /login. */
export const SESSION_EXPIRED_EVENT = 'healsync:session-expired'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/**
 * Base URL: default to the relative "/api" so the Vite dev proxy (and any same-origin
 * production deploy) forwards to the backend. Override with VITE_API_URL for a remote API.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

/** Socket.IO connects directly to the backend origin (not through the "/api" REST base) — the
 * server mounts it at the default "/socket.io" path on the same HTTP server as the REST API. */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.VITE_API_URL ? new URL(import.meta.env.VITE_API_URL).origin : 'http://localhost:5050')

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Normalize the backend's several error envelopes into one Error with a readable message. */
export class ApiError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string; error?: string; status?: string }>) => {
    if (error.response) {
      const { status, data } = error.response
      const message =
        data?.message || data?.error || defaultMessage(status) || 'Something went wrong.'
      // A stale/expired token: clear it and tell AuthContext, so the app actually falls back to
      // the login flow instead of continuing to render authenticated pages with no token.
      if (status === 401 && tokenStore.get()) {
        tokenStore.clear()
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
      return Promise.reject(new ApiError(message, status))
    }
    if (error.request) {
      return Promise.reject(new ApiError('Cannot reach the server. Is the backend running?', 0))
    }
    return Promise.reject(new ApiError(error.message))
  },
)

function defaultMessage(status: number) {
  const map: Record<number, string> = {
    400: 'Invalid request.',
    401: 'Please sign in to continue.',
    403: 'You do not have permission to do that.',
    404: 'Not found.',
    409: 'That already exists.',
    429: 'Too many attempts. Please slow down.',
    500: 'Server error. Please try again.',
  }
  return map[status]
}

export const isNetworkOrFeatureError = (err: unknown) =>
  err instanceof ApiError && (err.status === 0 || err.status === 500 || err.status === 404)

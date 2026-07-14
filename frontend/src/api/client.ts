import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'healsync-token'

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
      // A stale/expired token: clear it so the app falls back to the login flow.
      if (status === 401 && tokenStore.get()) {
        tokenStore.clear()
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

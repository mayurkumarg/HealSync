import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '@/api/auth'
import { api, tokenStore, SESSION_EXPIRED_EVENT } from '@/api/client'
import { decodeJwt, isJwtExpired } from '@/lib/jwt'
import { useToast } from '@/context/ToastContext'
import type { AuthUser, Role } from '@/types'

const ROLE_KEY = 'healsync-role'
const NAME_KEY = 'healsync-name'

interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (role: Role, email: string, password: string) => Promise<AuthUser>
  signup: (role: Role, body: Record<string, unknown>) => Promise<unknown>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

function hydrate(): AuthUser | null {
  const token = tokenStore.get()
  if (!token || isJwtExpired(token)) return null
  const payload = decodeJwt(token)
  if (!payload?.id) return null
  const role = (localStorage.getItem(ROLE_KEY) as Role) || (payload.type as Role) || 'patient'
  return {
    id: payload.id,
    email: payload.email,
    username: payload.username,
    name: localStorage.getItem(NAME_KEY) || payload.username,
    role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    setUser(hydrate())
    setLoading(false)
  }, [])

  // A request coming back 401 mid-session (expired token, server restart invalidating an old
  // session, etc.) clears the stored token and fires this event — react to it here so the app
  // actually drops back to the login screen instead of continuing to render authenticated pages
  // that every subsequent request will silently fail against.
  useEffect(() => {
    const onSessionExpired = () => {
      localStorage.removeItem(ROLE_KEY)
      localStorage.removeItem(NAME_KEY)
      setUser(null)
      toast.warning('Session expired', 'Please sign in again.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (role: Role, email: string, password: string) => {
    const res = await authApi.login(role, { email, password })
    tokenStore.set(res.token)
    localStorage.setItem(ROLE_KEY, role)
    const payload = decodeJwt(res.token)
    const nextUser: AuthUser = {
      id: payload?.id ?? '',
      email: payload?.email ?? email,
      username: payload?.username,
      name: payload?.username,
      role: (payload?.type as Role) || role,
    }

    // Doctor/hospital JWTs carry no name — fetch it from their /me endpoint so the UI can greet them.
    if (nextUser.role === 'doctor' || nextUser.role === 'hospital' || nextUser.role === 'pharmacy') {
      try {
        const { data } = await api.get(`/${nextUser.role}/me`)
        const me = data?.data ?? {}
        nextUser.name = me.name ?? nextUser.name
        nextUser.phone_no = me.phone_no ?? me.contactNo
      } catch {
        /* non-fatal — fall back to email in the UI */
      }
    }

    if (nextUser.name) localStorage.setItem(NAME_KEY, nextUser.name)
    setUser(nextUser)
    return nextUser
  }, [])

  const signup = useCallback((role: Role, body: Record<string, unknown>) => authApi.signup(role, body), [])

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem(ROLE_KEY)
    localStorage.removeItem(NAME_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthCtx>(
    () => ({ user, loading, isAuthenticated: !!user, login, signup, logout }),
    [user, loading, login, signup, logout],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
